import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['@monkeymask/react', '@monkeymask/wallet-standard'],
  outputFileTracingRoot: path.join(__dirname, '..'),
  compiler: {
    // Strip developer console noise from production builds, keeping
    // console.error (and console.warn) for genuine failure diagnostics.
    removeConsole: { exclude: ['error', 'warn'] },
  },
};

export default nextConfig;
