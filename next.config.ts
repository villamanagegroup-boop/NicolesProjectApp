import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local /cards/*.png images
    localPatterns: [
      {
        pathname: "/cards/**",
      },
    ],
    remotePatterns: [
      // Supabase storage (replace <project-ref> with your actual project ref)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
