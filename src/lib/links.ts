/**
 * Anti-penipuan: kolom berisi link HANYA menerima domain tepercaya. Dipakai
 * schema (validasi editor di browser + server action) dan tema (pengaman kedua
 * saat render, mis. untuk data lama) — tautan lain tidak pernah dirender.
 *
 * Teks bebas (pembuka, love story, penutup, dll.) TIDAK pernah dijadikan link:
 * tema merender teks apa adanya (tanpa linkify / HTML).
 */
export type LinkKind = "maps" | "liveStream" | "wishlist";

/**
 * host persis ATAU subdomainnya (mis. "zoom.us" → "us02web.zoom.us"); host
 * dengan aturan jalur (`paths`) hanya cocok persis.
 */
const RULES: Record<LinkKind, { hosts: string[]; paths?: Record<string, RegExp> }> = {
  maps: {
    hosts: ["maps.google.com", "maps.app.goo.gl", "goo.gl", "google.com", "google.co.id"],
    // google.com / google.co.id / goo.gl hanya untuk jalur peta
    paths: {
      "google.com": /^\/maps(\/|$|\?)/,
      "google.co.id": /^\/maps(\/|$|\?)/,
      "goo.gl": /^\/maps\//,
    },
  },
  liveStream: {
    hosts: ["youtube.com", "youtu.be", "zoom.us", "meet.google.com", "instagram.com"],
  },
  wishlist: {
    hosts: [
      "tokopedia.com",
      "tokopedia.link",
      "shopee.co.id",
      "shp.ee",
      "lazada.co.id",
      "blibli.com",
      "tiktok.com",
    ],
  },
};

export const TRUSTED_LABEL: Record<LinkKind, string> = {
  maps: "Google Maps",
  liveStream: "YouTube, Zoom, Google Meet, atau Instagram",
  wishlist: "Tokopedia, Shopee, Lazada, Blibli, atau TikTok Shop",
};

/** URL https/http dari domain tepercaya untuk jenis kolom ini? */
export function isTrustedUrl(raw: string | null | undefined, kind: LinkKind): boolean {
  if (!raw) return false;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.username || u.password) return false;
  const host = u.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "");
  const rule = RULES[kind];
  for (const h of rule.hosts) {
    const pathRule = rule.paths?.[h];
    if (pathRule) {
      // domain umum Google: host persis + jalur peta saja (bukan sites./docs.google.com)
      if (host === h && pathRule.test(u.pathname + (u.search ? "?" : ""))) return true;
    } else if (host === h || host.endsWith(`.${h}`)) return true;
  }
  return false;
}

/** Untuk tema: href aman atau undefined (tombol tidak dirender). */
export function safeHref(raw: string | null | undefined, kind: LinkKind): string | undefined {
  return raw && isTrustedUrl(raw, kind) ? raw : undefined;
}

/**
 * Akun Instagram: hanya nama akun (huruf, angka, titik, garis bawah; maks 30).
 * "@nama", "instagram.com/nama", dan "https://www.instagram.com/nama/" dinormalkan.
 */
export const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
export function normalizeInstagram(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}
export function instagramUrl(handle: string | null | undefined): string | undefined {
  if (!handle) return undefined;
  const h = normalizeInstagram(handle);
  return INSTAGRAM_RE.test(h) ? `https://instagram.com/${h}` : undefined;
}
