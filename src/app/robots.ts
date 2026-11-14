import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/** Halaman website boleh diindeks; area pribadi & alat tidak. Undangan: noindex per halaman. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/masuk", "/preview/"],
      },
    ],
    sitemap: `${siteConfig.appUrl}/sitemap.xml`,
    host: siteConfig.appUrl,
  };
}
