/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allow all Cloudinary paths
        search: '',
      },
      // Wasabi S3-compatible storage endpoints
      {
        protocol: 'https',
        hostname: 's3.us-east-1.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-2.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 's3.us-west-1.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 's3.eu-central-1.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 's3.ap-northeast-1.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-1.wasabisys.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      // Standard AWS S3 endpoints (if someone wants to use AWS S3 instead of Wasabi)
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: '',
        pathname: '/**',
        search: '',
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
