/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**", // Allow all Cloudinary paths
        search: "",
      },
    ],
    // Next.js Image optimization settings
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
    minimumCacheTTL: 86400, // Cache images for 24 hours
    dangerouslyAllowSVG: false, // Security: don't allow SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
