import "server-only";

import { db } from "@/lib/db";

import { RESERVED_SLUGS } from "./reserved";

/**
 * Slug undangan dipakai untuk subdomain {slug}.domain.id dan /u/{slug}:
 * huruf kecil, angka, tanda "-", 3–40 karakter, tidak boleh nama yang
 * dicadangkan (subdomain sistem).
 */
export { RESERVED_SLUGS };
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !slug.includes("--") && !RESERVED_SLUGS.has(slug);
}

/** Slug unik dari teks dasar ("Sekar Raka" → "sekar-raka", bila dipakai → "sekar-raka-7k2"). */
export async function uniqueSlug(base: string): Promise<string> {
  let root = slugify(base);
  if (root.length < 3) root = `undangan${root ? `-${root}` : ""}`;
  if (RESERVED_SLUGS.has(root)) root = `${root}-undangan`;
  root = root.slice(0, 35).replace(/-+$/g, "");
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 5)}`;
    if (!isValidSlug(candidate)) continue;
    const taken = await db.invitation.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
