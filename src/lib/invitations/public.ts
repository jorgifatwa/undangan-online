import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";

import { isActive } from "./publish";
import { RESERVED_SLUGS, SLUG_RE } from "./reserved";

/**
 * Undangan untuk halaman publik /{slug}, metadata & gambar pratinjau link.
 * `cache` → satu query per request walau dipakai generateMetadata + halaman.
 */
export const getPublicInvitation = cache(async (slug: string) => {
  // /{apa-saja} di root: tolak format tak valid & nama rute tanpa query database
  // (mis. /wp-login.php dari bot).
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) return null;
  const inv = await db.invitation.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      status: true,
      themeId: true,
      colorVariant: true,
      eventType: true,
      data: true,
      package: true,
      expiresAt: true,
      userId: true,
      updatedAt: true,
    },
  });
  if (!inv || inv.status !== "PUBLISHED") return null;
  return { ...inv, active: isActive(inv) };
});
