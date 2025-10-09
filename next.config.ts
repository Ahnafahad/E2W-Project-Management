import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Enforce linting during builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enforce type checking during builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
