import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@outdoorvoice/db", "@outdoorvoice/types"],
};

export default nextConfig;
