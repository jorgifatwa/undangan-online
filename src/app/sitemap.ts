import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Hanya halaman website publik. Halaman undangan (/{slug}) sengaja TIDAK
 * dicantumkan dan selalu noindex; /preview, /dashboard, /api juga tidak.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; freq: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/tema", priority: 0.9, freq: "weekly" },
    { path: "/harga", priority: 0.8, freq: "monthly" },
    { path: "/tentang", priority: 0.5, freq: "yearly" },
    { path: "/syarat", priority: 0.3, freq: "yearly" },
    { path: "/privasi", priority: 0.3, freq: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${siteConfig.appUrl}${p.path}`,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
