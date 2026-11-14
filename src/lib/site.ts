/**
 * Konfigurasi publik situs (aman dipakai di client & server).
 * Nama brand sengaja dari env agar mudah diganti tanpa ubah kode.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Undangan Online",
  description:
    "Buat undangan digital pernikahan & ulang tahun yang cantik dalam hitungan menit. Bagikan lewat WhatsApp.",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
} as const;

/** URL publik undangan: {APP_URL}/{slug} (slug tidak pernah sama dengan rute website). */
export function invitationUrl(slug: string): string {
  return `${siteConfig.appUrl}/${slug}`;
}

/** Link personal untuk satu tamu: ?to=Nama (dibersihkan lagi di server). */
export function guestLink(slug: string, guestName?: string | null): string {
  const name = guestName?.trim();
  return name ? `${invitationUrl(slug)}?to=${encodeURIComponent(name)}` : invitationUrl(slug);
}
