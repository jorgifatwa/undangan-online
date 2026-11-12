import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";

import { isActive } from "./publish";

/**
 * Undangan untuk halaman publik /u/{slug}, metadata & gambar pratinjau link.
 * `cache` → satu query per request walau dipakai generateMetadata + halaman.
 */
export const getPublicInvitation = cache(async (slug: string) => {
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
