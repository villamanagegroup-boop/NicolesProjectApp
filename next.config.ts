import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack ignores the stray
  // package-lock.json in C:\Users\hicks and doesn't infer the wrong root.
  turbopack: {
    root: import.meta.dirname,
  },
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
