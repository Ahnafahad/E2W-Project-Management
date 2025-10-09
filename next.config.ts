import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow build to succeed with linting warnings (unused imports, etc.)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Enforce strict TypeScript checking
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
