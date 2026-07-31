import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  allowedDevOrigins: ["127.0.0.1"],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = { poll: 1000, aggregateTimeout: 300 };
    }
    return config;
  },
};

export default nextConfig;
