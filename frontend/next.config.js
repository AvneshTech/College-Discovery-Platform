/** @type {import('next').NextConfig} */

// Allow remote images. The backend stores uploads on Cloudinary, so we
// whitelist the Cloudinary CDN host (covers every `cloud_name`) plus the
// Unsplash hosts used for the demo/fallback campus photos. Add your own
// production CDN host here if you serve images from elsewhere.
//
// NOTE (Phase 12): `SmartImage` still renders a plain <img> by default for
// maximum portability. Once your Cloudinary cloud_name is fixed in
// production you can flip `SmartImage` to next/image — these patterns are
// already in place so it will "just work".
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
  },
};

module.exports = nextConfig;
