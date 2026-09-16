import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle minimal autonome (.next/standalone) utilisé par l'add-on
  // Home Assistant et tout déploiement Docker. `next start` reste possible.
  output: "standalone",
};

export default nextConfig;
