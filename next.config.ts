import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Wikimedia serves thumbnails from more than one host (upload.wikimedia.org
      // is the usual one from the Wikipedia REST summary API; thumb.wikimedia.org
      // has turned up too). The wildcard covers the family while staying pinned
      // to wikimedia.org: the bare apex and lookalike domains don't match.
      {
        protocol: "https",
        hostname: "*.wikimedia.org",
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