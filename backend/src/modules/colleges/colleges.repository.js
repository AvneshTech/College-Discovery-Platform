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

  create: (data) => prisma.college.create({ data }),

  update: (id, data) => prisma.college.update({ where: { id }, data }),

  delete: (id) => prisma.college.delete({ where: { id } }),

  // Used by the recommendation engine: pull a candidate pool of colleges
  // that have cutoff data for the given exam/category near the user's rank.
  findCandidatesForPredictor: ({ exam, category }) =>
    prisma.college.findMany({
      where: { isPublished: true, cutoffs: { some: { exam, category } } },
      include: { cutoffs: { where: { exam, category }, orderBy: { year: "desc" } } },
    }),
};

module.exports = collegesRepository;
