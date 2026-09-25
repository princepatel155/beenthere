import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.LOCAL_INTEGRATION_TEST === '1' ? '.local/test-next' : '.next',
  serverExternalPackages: ['mongodb', '@netlify/blobs'],
};

export default nextConfig;
