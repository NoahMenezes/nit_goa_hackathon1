import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors for optional social media features
    ignoreBuildErrors: false,
  },
  // Exclude optional social media workflow from build
  experimental: {
    serverComponentsExternalPackages: ["@langchain/langgraph"],
  },
};

export default nextConfig;
