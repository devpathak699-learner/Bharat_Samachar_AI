import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Fallback to localhost if NEXT_PUBLIC_API_URL is not set
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default nextConfig;
