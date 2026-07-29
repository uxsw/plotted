import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      // Pl@ntNet reference imagery, shown on the identification results step.
      // These are never persisted — only the user's own photo is stored.
      {
        protocol: "https",
        hostname: "bs.plantnet.org",
      },
    ],
  },
};

export default nextConfig;