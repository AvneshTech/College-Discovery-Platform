// src/modules/uploads/uploads.routes.js
const express = require("express");
const upload = require("../../middleware/upload");
const uploadsController = require("./uploads.controller");
const { authMiddleware, requireRole } = require("../../middleware/auth");

const router = express.Router();

// Legacy generic upload — kept for backward compatibility.
router.post("/image", upload.single("image"), uploadsController.uploadImage);

// College branding — admin only.
router.post("/logo", authMiddleware, requireRole("ADMIN"), upload.single("image"), uploadsController.uploadLogo);
router.post("/banner", authMiddleware, requireRole("ADMIN"), upload.single("image"), uploadsController.uploadBanner);
router.post(
  "/gallery",
  authMiddleware,
  requireRole("ADMIN"),
  upload.single("image"),
  uploadsController.uploadGalleryImage
);
router.delete(
  "/gallery/:collegeId/:publicId",
  authMiddleware,
  requireRole("ADMIN"),
  uploadsController.deleteGalleryImage
);

// Any authenticated user can manage their own avatar.
router.post("/avatar", authMiddleware, upload.single("image"), uploadsController.uploadAvatar);

// Generic delete — admin only. publicId is sent in the body (not the URL)
// because Cloudinary publicIds contain "/" folder separators, and wildcard
// route syntax differs between Express 4 and 5 (path-to-regexp v6 vs v8).
router.delete("/", authMiddleware, requireRole("ADMIN"), uploadsController.deleteImage);

module.exports = router;
