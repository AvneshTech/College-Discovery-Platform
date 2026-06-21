// src/modules/colleges/colleges.routes.js
const router = require("express").Router();
const collegesController = require("./colleges.controller");
const {
  listQuerySchema,
  createCollegeSchema,
  updateCollegeSchema,
  compareSchema,
  predictorSchema,
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
  topListQuerySchema,
} = require("./colleges.schema");
const validate = require("../../middleware/validate");
const { authMiddleware, optionalAuth, requireRole } = require("../../middleware/auth");

// Public
router.get("/", validate(listQuerySchema), collegesController.list);
router.get("/featured", validate(topListQuerySchema), collegesController.featured);
router.get("/trending", validate(topListQuerySchema), collegesController.trending);
router.get("/most-viewed", validate(topListQuerySchema), collegesController.mostViewed);
router.post("/compare", validate(compareSchema), collegesController.compare);
router.post("/predictor", optionalAuth, validate(predictorSchema), collegesController.predict);
router.get("/:id", optionalAuth, collegesController.getById);

// Authenticated: any logged-in user can post/update their review for a college.
router.post("/:id/reviews", authMiddleware, validate(createReviewSchema), collegesController.createReview);

// Review edit / delete / like (Phase 10).
// Edit/delete are ownership-checked in the service (author only; ADMIN may also
// delete for moderation). Like is open to any authenticated user.
router.put(
  "/:id/reviews/:reviewId",
  authMiddleware,
  validate(updateReviewSchema),
  collegesController.updateReview
);
router.delete(
  "/:id/reviews/:reviewId",
  authMiddleware,
  validate(reviewParamsSchema),
  collegesController.deleteReview
);
router.post(
  "/:id/reviews/:reviewId/like",
  authMiddleware,
  validate(reviewParamsSchema),
  collegesController.likeReview
);

// Admin-only — RBAC enforced here, not just hidden in the UI
router.post("/", authMiddleware, requireRole("ADMIN"), validate(createCollegeSchema), collegesController.create);
router.put("/:id", authMiddleware, requireRole("ADMIN"), validate(updateCollegeSchema), collegesController.update);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), collegesController.remove);

module.exports = router;
