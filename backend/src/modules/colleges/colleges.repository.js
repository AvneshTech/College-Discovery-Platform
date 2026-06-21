// src/modules/colleges/colleges.repository.js
const prisma = require("../../config/prisma");

const collegesRepository = {
  async findMany({ where, skip, take, orderBy }) {
    const [total, colleges] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({ where, skip, take, orderBy }),
    ]);
    return { total, colleges };
  },

  findById: (id) =>
    prisma.college.findUnique({
      where: { id },
      include: { reviews: { take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }, deadlines: true },
    }),

  findByIds: (ids) => prisma.college.findMany({ where: { id: { in: ids } } }),

  // Reviews: one per user per college (enforced by @@unique([userId, collegeId])).
  // Upsert lets a user edit their existing review instead of erroring.
  upsertReview: ({ collegeId, userId, rating, title, body }) =>
    prisma.review.upsert({
      where: { userId_collegeId: { userId, collegeId } },
      create: { collegeId, userId, rating, title, body },
      update: { rating, title, body },
      include: { user: { select: { name: true } } },
    }),

  aggregateReviews: (collegeId) =>
    prisma.review.aggregate({
      where: { collegeId },
      _avg: { rating: true },
      _count: { _all: true },
    }),

  // Keep the denormalized College.rating / reviewCount in sync after a review.
  setRatingAggregate: (collegeId, rating, reviewCount) =>
    prisma.college.update({ where: { id: collegeId }, data: { rating, reviewCount } }),

  // ── Review edit / delete / like (Phase 10) ───────────────────────────────
  findReviewById: (id) =>
    prisma.review.findUnique({ where: { id }, include: { user: { select: { name: true } } } }),

  updateReview: ({ id, rating, title, body }) =>
    prisma.review.update({
      where: { id },
      data: { rating, title, body },
      include: { user: { select: { name: true } } },
    }),

  deleteReview: (id) => prisma.review.delete({ where: { id } }),

  // Atomic increment so concurrent likes never clobber each other.
  likeReview: (id) =>
    prisma.review.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
      include: { user: { select: { name: true } } },
    }),

  create: (data) => prisma.college.create({ data }),

  update: (id, data) => prisma.college.update({ where: { id }, data }),

  delete: (id) => prisma.college.delete({ where: { id } }),

  // Analytics: record a CollegeView row (for time-series "trending" queries)
  // and bump the denormalized College.viewsCount in a single transaction so
  // the two never drift apart.
  recordView: (collegeId, userId) =>
    prisma.$transaction([
      prisma.collegeView.create({ data: { collegeId, userId: userId ?? null } }),
      prisma.college.update({ where: { id: collegeId }, data: { viewsCount: { increment: 1 } } }),
    ]),

  incrementCompareCount: (ids) =>
    prisma.college.updateMany({ where: { id: { in: ids } }, data: { compareCount: { increment: 1 } } }),

  incrementSaveCount: (collegeId) =>
    prisma.college.update({ where: { id: collegeId }, data: { saveCount: { increment: 1 } } }),

  decrementSaveCount: (collegeId) =>
    // Guard against going negative if counts ever drift (e.g. manual DB edits).
    prisma.college.updateMany({
      where: { id: collegeId, saveCount: { gt: 0 } },
      data: { saveCount: { decrement: 1 } },
    }),

  findFeatured: (limit) =>
    prisma.college.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { rating: "desc" },
      take: limit,
    }),

  // "Trending" = most viewed in the last 7 days (CollegeView time-series),
  // not just lifetime viewsCount — surfaces colleges currently getting
  // attention rather than ones that were popular a year ago.
  async findTrending(limit) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grouped = await prisma.collegeView.groupBy({
      by: ["collegeId"],
      where: { viewedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { collegeId: "desc" } },
      take: limit,
    });
    if (grouped.length === 0) return [];
    const colleges = await prisma.college.findMany({
      where: { id: { in: grouped.map((g) => g.collegeId) }, isPublished: true },
    });
    const order = new Map(grouped.map((g, i) => [g.collegeId, i]));
    return colleges.sort((a, b) => order.get(a.id) - order.get(b.id));
  },

  findMostViewed: (limit) =>
    prisma.college.findMany({
      where: { isPublished: true },
      orderBy: { viewsCount: "desc" },
      take: limit,
    }),

  findMostSaved: (limit) =>
    prisma.college.findMany({
      where: { isPublished: true },
      orderBy: { saveCount: "desc" },
      take: limit,
    }),

  findMostCompared: (limit) =>
    prisma.college.findMany({
      where: { isPublished: true },
      orderBy: { compareCount: "desc" },
      take: limit,
    }),

  // Used by the recommendation engine: pull a candidate pool of colleges
  // that have cutoff data for the given exam/category near the user's rank.
  findCandidatesForPredictor: ({ exam, category }) =>
    prisma.college.findMany({
      where: { isPublished: true, cutoffs: { some: { exam, category } } },
      include: { cutoffs: { where: { exam, category }, orderBy: { year: "desc" } } },
    }),
};

module.exports = collegesRepository;
