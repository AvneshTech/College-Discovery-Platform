// src/modules/uploads/uploads.service.js
const streamifier = require("streamifier");
const cloudinary = require("../../config/cloudinary");
const prisma = require("../../config/prisma");

// Low-level Cloudinary stream upload — unchanged signature for backward
// compatibility with the original generic /api/uploads/image endpoint.
function uploadToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

function deleteFromCloudinary(publicId) {
  if (!publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

// Uploads to Cloudinary AND records an Upload row, so every image the
// platform serves is auditable (who uploaded it, which folder, when) and
// can be cleaned up later even if the owning College/User row is edited
// without going through this service.
async function uploadAndTrack(file, folder, uploadedBy) {
  const result = await uploadToCloudinary(file, folder);
  await prisma.upload.create({
    data: { publicId: result.public_id, url: result.secure_url, folder, uploadedBy: uploadedBy ?? null },
  });
  return result;
}

// Replace = upload the new image, then best-effort delete the old one.
// Upload-then-delete (not delete-then-upload) so a failed upload never
// leaves the college/user without any image at all.
async function replaceImage({ file, folder, uploadedBy, oldPublicId }) {
  const result = await uploadAndTrack(file, folder, uploadedBy);
  if (oldPublicId) {
    try {
      await deleteFromCloudinary(oldPublicId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete old Cloudinary asset", oldPublicId, err);
    }
  }
  return result;
}

async function removeUpload(publicId) {
  await deleteFromCloudinary(publicId);
  await prisma.upload.deleteMany({ where: { publicId } });
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadAndTrack,
  replaceImage,
  removeUpload,
};
