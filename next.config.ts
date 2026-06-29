import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep DB driver packages out of the bundle so they resolve at runtime.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
