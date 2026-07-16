/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Enable type checking during production builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable eslint checks during production builds
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
