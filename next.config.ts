import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', '@netlify/blobs'],
};

export default nextConfig;
