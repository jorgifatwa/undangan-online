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

  /**
   * Nomor WhatsApp admin, format internasional tanpa "+". Dipakai untuk
   * pesanan (form /pesan → WhatsApp) dan sebagai kontak umum (footer,
   * /tentang, halaman legal).
   */
  whatsapp: "6285795560811" as string | null,
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

  /**
   * Layanan mandiri (pelanggan membuat & mengedit undangan sendiri).
   * false = model jasa lewat WhatsApp: pelanggan memesan lewat /pesan, admin
   * yang membuat undangan. Wizard & dashboard tetap ada tetapi hanya untuk
   * admin (ADMIN_EMAILS). Ubah ke true untuk membuka layanan mandiri lagi.
   */
  selfService: false as boolean,

  /** Aturan jasa pembuatan undangan (tampil di form, konfirmasi, FAQ, syarat). */
  service: {
    /** Jam operasional admin. */
    hours: { open: "08.00", close: "21.00", timezone: "WIB" },
    /** Lama pengerjaan setelah data lengkap & pembayaran diterima. */
    turnaround: "1–2 jam",
    /** Revisi gratis per pesanan. */
    freeRevisions: 2,
    /** Pesanan Baru/Dibatalkan yang belum dibayar & tidak diubah N hari → dihapus. */
    purgeUnpaidAfterDays: 30,
    /** Batas foto galeri yang disebut di form pemesanan. */
    galleryPhotos: 12,
  },
} as const;

/** "08.00–21.00 WIB" */
export const serviceHours = () =>
  `${business.service.hours.open}–${business.service.hours.close} ${business.service.hours.timezone}`;

export const waLink = (text?: string) =>
  business.whatsapp
    ? `https://wa.me/${business.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`
    : null;
export const instagramLink = () =>
  business.instagram ? `https://instagram.com/${business.instagram}` : null;
export const hasContact = () => !!(business.whatsapp || business.email || business.instagram);
