import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-ical"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
