import { siteConfig } from "@/lib/site";

/**
 * DATA USAHA — satu-satunya tempat untuk identitas & kontak yang tampil di
 * website (landing, footer, /tentang, halaman legal, structured data).
 *
 * ATURAN: nilai `null` = belum ada → TIDAK ditampilkan di mana pun.
 * Contoh isian ada di komentar CONTOH; ganti `null` dengan nilai asli.
 */
export const business = {
  /** Nama brand dari env NEXT_PUBLIC_BRAND_NAME (default "Undangan Online"). */
  name: siteConfig.name,

  /**
   * Tagline (tampil di hero, metadata, footer). Usulan lain:
   *  - "Dari hati, sampai ke setiap tamu."
   *  - "Hangat seperti undangan cetak, semudah mengirim pesan."
   */
  tagline: "Undangan digital yang terasa personal",

  /**
   * Tentang kami (2–3 kalimat, cerita usaha Anda) — tampil di /tentang & footer.
   * CONTOH: "Undangan Online lahir di Bandung dari kebiasaan kami membantu teman
   * menyiapkan undangan pernikahan. …"
   */
  about: null as string | null,

  /** Nomor WhatsApp format internasional tanpa "+" (CONTOH: "6281234567890"). */
  whatsapp: null as string | null,
  /** CONTOH: "halo@undanganonline.id" */
  email: null as string | null,
  /** Nama akun tanpa "@" (CONTOH: "undanganonline.id"). */
  instagram: null as string | null,
  /** CONTOH: "Bandung" */
  city: null as string | null,

  /**
   * Testimoni ASLI saja (dengan izin yang bersangkutan). Kosong = section
   * testimoni tidak tampil. Jangan mengarang testimoni atau angka pengguna.
   */
  testimonials: [] as { name: string; event: string; quote: string }[],
} as const;

export const waLink = (text?: string) =>
  business.whatsapp
    ? `https://wa.me/${business.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`
    : null;
export const instagramLink = () =>
  business.instagram ? `https://instagram.com/${business.instagram}` : null;
export const hasContact = () => !!(business.whatsapp || business.email || business.instagram);
