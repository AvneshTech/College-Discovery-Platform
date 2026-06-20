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
} = require("./colleges.schema");
const validate = require("../../middleware/validate");
const { authMiddleware, optionalAuth, requireRole } = require("../../middleware/auth");

// Public
router.get("/", validate(listQuerySchema), collegesController.list);
router.post("/compare", validate(compareSchema), collegesController.compare);
router.post("/predictor", optionalAuth, validate(predictorSchema), collegesController.predict);
router.get("/:id", collegesController.getById);

// Authenticated: any logged-in user can post/update their review for a college.
router.post("/:id/reviews", authMiddleware, validate(createReviewSchema), collegesController.createReview);

// Admin-only — RBAC enforced here, not just hidden in the UI
router.post("/", authMiddleware, requireRole("ADMIN"), validate(createCollegeSchema), collegesController.create);
router.put("/:id", authMiddleware, requireRole("ADMIN"), validate(updateCollegeSchema), collegesController.update);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), collegesController.remove);

module.exports = router;
