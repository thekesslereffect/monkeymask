import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['@monkeymask/react', '@monkeymask/wallet-standard'],
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
