// src/modules/colleges/colleges.service.js
const collegesRepository = require("./colleges.repository");
const prisma = require("../../config/prisma");
const { ApiError } = require("../../middleware/errorHandler");
const { recommendColleges } = require("./recommendation.engine");
const slugify = require("../../utils/slugify");

const collegesService = {
  async list(filters) {
    const { page, limit, search, city, minRating, maxFees, branch, sortBy } = filters;

    const where = { isPublished: true };
    const AND = [];
    if (search) {
      AND.push({ OR: [{ name: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }] });
    }
    if (city) AND.push({ city: { equals: city, mode: "insensitive" } });
    if (minRating !== undefined) AND.push({ rating: { gte: minRating } });
    if (maxFees !== undefined) AND.push({ fees: { lte: maxFees } });
    if (branch) AND.push({ branches: { has: branch } });
    if (AND.length) where.AND = AND;

    const { total, colleges } = await collegesRepository.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortBy === "fees" ? "asc" : "desc" },
    });

    return { colleges, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async getById(id) {
    const college = await collegesRepository.findById(id);
    if (!college) throw new ApiError(404, "College not found");
    return college;
  },

  async create(data, adminId) {
    const slug = await slugify.unique(data.name, (s) => prisma.college.findUnique({ where: { slug: s } }));
    return collegesRepository.create({ ...data, slug, createdById: adminId });
  },

  async update(id, data) {
    await this.getById(id); // 404 if missing
    return collegesRepository.update(id, data);
  },

  async remove(id) {
    await this.getById(id);
    return collegesRepository.delete(id);
  },

  // Create (or update) the current user's review, then recompute the
  // college's aggregate rating + review count from the real Review rows.
  async addReview(collegeId, userId, data) {
    await this.getById(collegeId); // 404 if the college doesn't exist
    const review = await collegesRepository.upsertReview({ collegeId, userId, ...data });

    const agg = await collegesRepository.aggregateReviews(collegeId);
    const avg = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
    await collegesRepository.setRatingAggregate(collegeId, avg, agg._count._all);

    return review;
  },

  async compare(ids) {
    const colleges = await collegesRepository.findByIds(ids);
    if (colleges.length !== ids.length) throw new ApiError(404, "One or more colleges not found");
    return colleges;
  },

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
