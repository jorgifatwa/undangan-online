/**
 * Konfigurasi publik situs (aman dipakai di client & server).
 * Nama brand sengaja dari env agar mudah diganti tanpa ubah kode.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Undangku",
  description:
    "Buat undangan digital pernikahan & ulang tahun yang cantik dalam hitungan menit. Bagikan lewat WhatsApp.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000",
} as const;

/** URL publik sebuah undangan (subdomain utama). */
export function invitationUrl(slug: string): string {
  const protocol = siteConfig.appUrl.startsWith("https") ? "https" : "http";
  return `${protocol}://${slug}.${siteConfig.rootDomain}`;
}
