import { RESERVED_SLUGS } from "@/lib/invitations/reserved";

/**
 * Konfigurasi publik situs (aman dipakai di client & server).
 * Nama brand sengaja dari env agar mudah diganti tanpa ubah kode.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Undangku",
  description:
    "Buat undangan digital pernikahan & ulang tahun yang cantik dalam hitungan menit. Bagikan lewat WhatsApp.",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  /**
   * Domain root subdomain undangan: {slug}.ROOT_DOMAIN. KOSONG = subdomain
   * nonaktif → link undangan memakai {APP_URL}/u/{slug} (staging tanpa domain).
   * Lokal bisa diisi "localhost:3000" (Chrome mengarahkan *.localhost ke mesin sendiri).
   * Variabel NEXT_PUBLIC_* ditanam saat build → ubah env lalu deploy ulang.
   */
  rootDomain: (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim().toLowerCase(),
} as const;

export const subdomainEnabled = siteConfig.rootDomain !== "";

/** URL publik sebuah undangan: subdomain bila aktif, selain itu /u/{slug}. */
export function invitationUrl(slug: string): string {
  if (!subdomainEnabled) return `${siteConfig.appUrl}/u/${slug}`;
  const protocol = siteConfig.appUrl.startsWith("https") ? "https" : "http";
  return `${protocol}://${slug}.${siteConfig.rootDomain}`;
}

/** Link personal untuk satu tamu: ?to=Nama (dibersihkan lagi di server). */
export function guestLink(slug: string, guestName?: string | null): string {
  const base = invitationUrl(slug);
  const name = guestName?.trim();
  return name ? `${base}${subdomainEnabled ? "/" : ""}?to=${encodeURIComponent(name)}` : base;
}

/**
 * Slug dari host subdomain ("kirana-galih.undangku.id" → "kirana-galih"),
 * null bila bukan subdomain undangan. Dipakai middleware (Edge).
 */
export function slugFromHost(host: string | null): string | null {
  if (!subdomainEnabled || !host) return null;
  const h = host.toLowerCase();
  const suffix = `.${siteConfig.rootDomain}`;
  if (!h.endsWith(suffix)) return null;
  const sub = h.slice(0, -suffix.length);
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(sub) && !RESERVED_SLUGS.has(sub) ? sub : null;
}
