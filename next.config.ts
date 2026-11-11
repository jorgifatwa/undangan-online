import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Badge dev Next.js menutupi tombol di pojok undangan saat preview/screenshot.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
