import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors for optional social media features
    ignoreBuildErrors: false,
  },
  // Exclude optional social media workflow from build
  serverExternalPackages: ["@langchain/langgraph"],
};

export default nextConfig;
