// src/modules/analytics/analytics.routes.js
// Lightweight, read-only admin analytics. Deliberately kept as a single
// router (no separate repository/service layers) since every handler here
// is a one-shot aggregate query with no business logic to unit-test in
// isolation — matches the project's existing pattern for the discussions
// module (see discussions.routes.js).
const router = require("express").Router();
const { z } = require("zod");
const prisma = require("../../config/prisma");
const { asyncHandler } = require("../../middleware/errorHandler");
const { authMiddleware, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const collegesRepository = require("../colleges/colleges.repository");

const topListQuerySchema = z.object({
  query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }),
});

// GET /api/analytics/dashboard — top-line counts for the admin home screen.
router.get(
  "/dashboard",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalColleges,
      totalReviews,
      totalDiscussions,
      totalAnswers,
      totalSaves,
      totalContactInquiries,
      unresolvedInquiries,
      viewsAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.college.count(),
      prisma.review.count(),
      prisma.discussion.count(),
      prisma.answer.count(),
      prisma.savedCollege.count(),
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { isResolved: false } }),
      prisma.college.aggregate({ _sum: { viewsCount: true } }),
    ]);

    res.json({
      totalUsers,
      totalColleges,
      totalReviews,
      totalDiscussions,
      totalAnswers,
      totalSaves,
      totalViews: viewsAgg._sum.viewsCount ?? 0,
      totalContactInquiries,
      unresolvedInquiries,
    });
  })
);

// GET /api/analytics/most-saved — admin-only (public version lives at
// GET /api/colleges/most-viewed and /featured and /trending).
router.get(
  "/most-saved",
  authMiddleware,
  requireRole("ADMIN"),
  validate(topListQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await collegesRepository.findMostSaved(req.query.limit));
  })
);

router.get(
  "/most-compared",
  authMiddleware,
  requireRole("ADMIN"),
  validate(topListQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await collegesRepository.findMostCompared(req.query.limit));
  })
);

module.exports = router;
