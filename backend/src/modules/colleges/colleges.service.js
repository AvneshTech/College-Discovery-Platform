// src/modules/colleges/colleges.service.js
const collegesRepository = require("./colleges.repository");
const prisma = require("../../config/prisma");
const { ApiError } = require("../../middleware/errorHandler");
const { recommendColleges } = require("./recommendation.engine");
const slugify = require("../../utils/slugify");

// Build the human label (e.g. "₹2.2L / yr") from the numeric annual fee, so
// admins only edit the number and the cards/detail stay in sync automatically.
function formatFeesDisplay(fees) {
  if (fees == null) return undefined;
  if (fees >= 100000) return `₹${(fees / 100000).toFixed(1)}L / yr`;
  return `₹${Number(fees).toLocaleString("en-IN")} / yr`;
}

// Recompute and persist the denormalized College.rating / reviewCount from the
// real Review rows. Shared by create/edit/delete so they never drift.
async function recomputeRating(collegeId) {
  const agg = await collegesRepository.aggregateReviews(collegeId);
  const avg = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
  await collegesRepository.setRatingAggregate(collegeId, avg, agg._count._all);
}

const collegesService = {
  async list(filters) {
    const { page, limit, search, city, state, minRating, maxFees, branch, course, featured, verified, sortBy } = filters;

    const where = { isPublished: true };
    const AND = [];
    if (search) {
      AND.push({ OR: [{ name: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }] });
    }
    if (city) AND.push({ city: { equals: city, mode: "insensitive" } });
    if (state) AND.push({ state: { equals: state, mode: "insensitive" } });
    if (minRating !== undefined) AND.push({ rating: { gte: minRating } });
    if (maxFees !== undefined) AND.push({ fees: { lte: maxFees } });
    if (branch) AND.push({ branches: { has: branch } });
    if (course) AND.push({ courses: { has: course } });
    if (featured !== undefined) AND.push({ isFeatured: featured });
    if (verified !== undefined) AND.push({ isVerified: verified });
    if (AND.length) where.AND = AND;

    const { total, colleges } = await collegesRepository.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortBy === "fees" ? "asc" : "desc" },
    });

    return { colleges, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async getById(id, viewerId) {
    const college = await collegesRepository.findById(id);
    if (!college) throw new ApiError(404, "College not found");

    // Fire-and-forget-ish, but awaited so tests/serverless cold starts are
    // deterministic. Doesn't block the response on anything but a single
    // cheap transaction.
    await collegesRepository.recordView(id, viewerId ?? null);
    college.viewsCount += 1; // reflect the increment in this response without a second read

    return college;
  },

  async create(data, adminId) {
    const slug = await slugify.unique(data.name, (s) => prisma.college.findUnique({ where: { slug: s } }));
    const feesDisplay = data.fees != null ? formatFeesDisplay(data.fees) : undefined;
    return collegesRepository.create({ ...data, slug, feesDisplay, createdById: adminId });
  },

  async update(id, data) {
    await collegesRepository.findById(id).then((c) => {
      if (!c) throw new ApiError(404, "College not found");
    });
    const patch = { ...data };
    if (data.fees != null) patch.feesDisplay = formatFeesDisplay(data.fees);
    return collegesRepository.update(id, patch);
  },

  async remove(id) {
    const existing = await collegesRepository.findById(id);
    if (!existing) throw new ApiError(404, "College not found");
    return collegesRepository.delete(id);
  },

  // Create (or update) the current user's review, then recompute the
  // college's aggregate rating + review count from the real Review rows.
  async addReview(collegeId, userId, data) {
    const existing = await collegesRepository.findById(collegeId);
    if (!existing) throw new ApiError(404, "College not found");
    const review = await collegesRepository.upsertReview({ collegeId, userId, ...data });

    await recomputeRating(collegeId);
    return review;
  },

  // ── Review edit / delete / like (Phase 10) ───────────────────────────────
  // Ownership: only the review's author may edit/delete it; an ADMIN may also
  // delete (moderation). Likes are open to any authenticated user.
  async updateReview(collegeId, reviewId, userId, data) {
    const review = await collegesRepository.findReviewById(reviewId);
    if (!review || review.collegeId !== collegeId) throw new ApiError(404, "Review not found");
    if (review.userId !== userId) throw new ApiError(403, "You can only edit your own review");

    const updated = await collegesRepository.updateReview({ id: reviewId, ...data });
    await recomputeRating(collegeId);
    return updated;
  },

  async deleteReview(collegeId, reviewId, user) {
    const review = await collegesRepository.findReviewById(reviewId);
    if (!review || review.collegeId !== collegeId) throw new ApiError(404, "Review not found");
    if (review.userId !== user.id && user.role !== "ADMIN") {
      throw new ApiError(403, "You can only delete your own review");
    }
    await collegesRepository.deleteReview(reviewId);
    await recomputeRating(collegeId);
    return { message: "Review deleted" };
  },

  async likeReview(collegeId, reviewId) {
    const review = await collegesRepository.findReviewById(reviewId);
    if (!review || review.collegeId !== collegeId) throw new ApiError(404, "Review not found");
    return collegesRepository.likeReview(reviewId);
  },

  async compare(ids) {
    const colleges = await collegesRepository.findByIds(ids);
    if (colleges.length !== ids.length) throw new ApiError(404, "One or more colleges not found");
    // Track that these colleges were compared together — feeds the
    // "Most Compared Colleges" analytics widget.
    await collegesRepository.incrementCompareCount(ids);
    return colleges;
  },

  featured: (limit) => collegesRepository.findFeatured(limit),
  trending: (limit) => collegesRepository.findTrending(limit),
  mostViewed: (limit) => collegesRepository.findMostViewed(limit),

  // The "AI-Powered Recommendation Engine" — see recommendation.engine.js
  async predict(input) {
    const candidates = await collegesRepository.findCandidatesForPredictor({
      exam: input.exam,
      category: input.category,
    });

    if (candidates.length === 0) {
      throw new ApiError(404, "No cutoff data available yet for this exam/category combination");
    }

    const ranked = recommendColleges(candidates, input);
    return ranked.slice(0, 15);
  },
};

module.exports = collegesService;
