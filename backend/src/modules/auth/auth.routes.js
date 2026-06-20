// src/modules/auth/auth.routes.js
const router = require("express").Router();
const authController = require("./auth.controller");
const { registerSchema, loginSchema } = require("./auth.schema");
const validate = require("../../middleware/validate");
const { authMiddleware } = require("../../middleware/auth");
const { authLimiter } = require("../../middleware/security");

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
