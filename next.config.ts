import type { NextConfig } from "next";

/** Domain publik R2 (foto & musik user) untuk next/image. */
const r2 = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  // Biner ffmpeg dibaca dari node_modules apa adanya (bukan dibundel).
  serverExternalPackages: ["ffmpeg-static"],
  // Font TTF gambar pratinjau link dibaca lewat fs → sertakan di bundel fungsi.
  outputFileTracingIncludes: { "/[slug]/og": ["./src/lib/og/fonts/*.ttf"] },
  // Undangan pindah dari /u/{slug} ke /{slug}: tautan lama yang sudah terlanjur
  // dibagikan dialihkan PERMANEN (301); query (?to=Nama) ikut otomatis.
  async redirects() {
    return [
      { source: "/u/:slug", destination: "/:slug", statusCode: 301 },
      { source: "/u/:slug/og", destination: "/:slug/og", statusCode: 301 },
    ];
  },
  // Badge dev Next.js menutupi tombol di pojok undangan saat preview/screenshot.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2
      ? [{ protocol: r2.protocol.replace(":", "") as "https", hostname: r2.hostname }]
      : [],
  },
};

export default nextConfig;
