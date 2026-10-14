import type { NextConfig } from "next";

const devPatterns =
  process.env.NODE_ENV === "development"
    ? [
        { protocol: "http" as const, hostname: "localhost", port: "8000", pathname: "/**" },
        { protocol: "http" as const, hostname: "127.0.0.1", port: "8000", pathname: "/**" },
      ]
    : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "techcommunity.microsoft.com", port: "", pathname: "/**" },
      ...devPatterns,
    ],
    minimumCacheTTL: 10,
  },
  experimental: {
    turbopackServerFastRefresh: false
  }
};

export default nextConfig;
