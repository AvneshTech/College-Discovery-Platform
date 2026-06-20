/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // College logos/banners come from arbitrary external CDNs. Restrict to
    // https and (optionally) tighten to your known image hosts in production.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
