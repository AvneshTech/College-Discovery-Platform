// src/modules/uploads/uploads.controller.js
const {
  uploadToCloudinary,
  uploadAndTrack,
  replaceImage,
  removeUpload,
} = require("./uploads.service");
const prisma = require("../../config/prisma");
const { asyncHandler, ApiError } = require("../../middleware/errorHandler");

// Generic single-image upload — preserved as-is for backward compatibility
// with any existing client already calling POST /api/uploads/image.
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const result = await uploadToCloudinary(req.file, "collegeedge");
  res.json({ url: result.secure_url, publicId: result.public_id });
});

async function getCollegeOr404(id) {
  const college = await prisma.college.findUnique({ where: { id } });
  if (!college) throw new ApiError(404, "College not found");
  return college;
}

// POST /api/uploads/logo  (admin, multipart: image, collegeId)
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const collegeId = Number(req.body.collegeId);
  if (!collegeId) throw new ApiError(400, "collegeId is required");
  const college = await getCollegeOr404(collegeId);

  const result = await replaceImage({
    file: req.file,
    folder: "collegeedge/colleges/logos",
    uploadedBy: req.user.id,
    oldPublicId: college.logoPublicId,
  });

  const updated = await prisma.college.update({
    where: { id: collegeId },
    data: { logoUrl: result.secure_url, logoPublicId: result.public_id },
  });

  res.json({ url: updated.logoUrl, publicId: updated.logoPublicId });
});

// POST /api/uploads/banner (admin, multipart: image, collegeId)
const uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const collegeId = Number(req.body.collegeId);
  if (!collegeId) throw new ApiError(400, "collegeId is required");
  const college = await getCollegeOr404(collegeId);

  const result = await replaceImage({
    file: req.file,
    folder: "collegeedge/colleges/banners",
    uploadedBy: req.user.id,
    oldPublicId: college.bannerPublicId,
  });

  const updated = await prisma.college.update({
    where: { id: collegeId },
    data: { bannerUrl: result.secure_url, bannerPublicId: result.public_id },
  });

  res.json({ url: updated.bannerUrl, publicId: updated.bannerPublicId });
});

// POST /api/uploads/gallery (admin, multipart: image, collegeId, caption?)
// Gallery is a JSON array on College.gallery — append rather than replace.
const uploadGalleryImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const collegeId = Number(req.body.collegeId);
  if (!collegeId) throw new ApiError(400, "collegeId is required");
  const college = await getCollegeOr404(collegeId);

  const result = await uploadAndTrack(req.file, "collegeedge/colleges/gallery", req.user.id);
  const existingGallery = Array.isArray(college.gallery) ? college.gallery : [];
  const newGallery = [
    ...existingGallery,
    { url: result.secure_url, publicId: result.public_id, caption: req.body.caption || null },
  ];

  const updated = await prisma.college.update({
    where: { id: collegeId },
    data: { gallery: newGallery },
  });

  res.status(201).json({ gallery: updated.gallery });
});

// DELETE /api/uploads/gallery/:collegeId/:publicId (admin)
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const collegeId = Number(req.params.collegeId);
  const { publicId } = req.params;
  const college = await getCollegeOr404(collegeId);

  const existingGallery = Array.isArray(college.gallery) ? college.gallery : [];
  const newGallery = existingGallery.filter((img) => img.publicId !== publicId);

  await removeUpload(publicId);
  const updated = await prisma.college.update({ where: { id: collegeId }, data: { gallery: newGallery } });

  res.json({ gallery: updated.gallery });
});

// POST /api/uploads/avatar (authenticated user, multipart: image)
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const result = await replaceImage({
    file: req.file,
    folder: "collegeedge/users/avatars",
    uploadedBy: req.user.id,
    oldPublicId: user.avatarPublicId,
  });

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: result.secure_url, avatarPublicId: result.public_id },
  });

  res.json({ url: updated.avatarUrl, publicId: updated.avatarPublicId });
});

// DELETE /api/uploads — body: { publicId }. Generic Cloudinary + Upload-row
// cleanup, used for ad-hoc images not tied to a logo/banner/gallery slot.
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new ApiError(400, "publicId is required");
  await removeUpload(publicId);
  res.json({ message: "Image deleted" });
});

module.exports = {
  uploadImage,
  uploadLogo,
  uploadBanner,
  uploadGalleryImage,
  deleteGalleryImage,
  uploadAvatar,
  deleteImage,
};
