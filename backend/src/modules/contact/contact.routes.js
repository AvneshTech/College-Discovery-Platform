// src/modules/contact/contact.routes.js
const router = require("express").Router();
const contactController = require("./contact.controller");
const { createInquirySchema, listQuerySchema } = require("./contact.schema");
const validate = require("../../middleware/validate");
const { authMiddleware, optionalAuth, requireRole } = require("../../middleware/auth");
const { authLimiter } = require("../../middleware/security");

// Public — anyone can submit a contact form. optionalAuth so we can link
// the inquiry to a logged-in user without requiring login.
router.post("/", optionalAuth, authLimiter, validate(createInquirySchema), contactController.submit);

// Admin-only management
router.get("/", authMiddleware, requireRole("ADMIN"), validate(listQuerySchema), contactController.list);
router.patch("/:id/resolve", authMiddleware, requireRole("ADMIN"), contactController.resolve);

module.exports = router;
