import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Set the workspace root to silence multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname),

  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true, // Disable image optimization for development
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Webpack configuration to fix chunk loading issues
  webpack: (config, { isServer }) => {
    // Disable webpack cache to prevent chunk loading errors
    config.cache = false;

    return config;
  },
};

export default nextConfig;
