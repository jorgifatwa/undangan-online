import { business } from "@/config/business";
import { MEDIA_RETENTION_DAYS } from "@/lib/invitations/retention";
import { MAX_AUDIO_SECONDS, MAX_PHOTO_BYTES } from "@/lib/media/limits";
import {
  PACKAGE_ORDER,
  PACKAGES,
  PAID_ACTIVE,
  activeLabel,
  type PackageFeatures,
} from "@/lib/packages";
import type { PackageTier } from "@prisma/client";

/**
 * Isi teks website publik yang bergantung pada fakta produk. Semua angka
 * dibaca dari sumbernya (packages.ts, limits.ts, retention.ts) agar halaman
 * tidak pernah menjanjikan sesuatu yang berbeda dari aplikasi.
 */

type BoolFeature = {
  [K in keyof PackageFeatures]: PackageFeatures[K] extends boolean ? K : never;
}[keyof PackageFeatures];

/**
 * Status fitur paket: "ready" = sudah bisa dipakai, "soon" = tercantum di
 * paket tapi BELUM dibuat → website memberi label "Segera hadir".
 * Perbarui saat fitur selesai dibuat.
 */
export const FEATURE_STATUS: Record<BoolFeature, "ready" | "soon"> = {
  watermark: "ready",
  maps: "ready",
  rsvp: "ready",
  wishes: "ready",
  customMusic: "ready",
  digitalEnvelope: "ready",
  personalGuestNames: "soon",
  guestImportExcel: "soon",
  bulkWhatsapp: "soon",
  qrCheckIn: "soon",
  privateMode: "soon",
  interactiveThemes: "soon",
  prioritySupport: "soon",
};

/** Paket berbayar termurah yang punya fitur ini. */
export function minTierFor(feature: BoolFeature): PackageTier | null {
  return PACKAGE_ORDER.find((t) => PACKAGES[t].features[feature] === true) ?? null;
}

const mb = (n: number) => (n >= 1000 ? `${n / 1000} GB` : `${n} MB`);

/** Baris perbandingan paket (kartu harga & tabel /harga). */
export const PRICE_ROWS: {
  label: string;
  value: (f: PackageFeatures) => string | boolean;
  soon?: boolean;
  /** Kartu harga: tampilkan nilainya saja (tanpa "Label: "). */
  valueOnly?: boolean;
}[] = [
  { label: "Masa aktif", value: (f) => activeLabel(f), valueOnly: true },
  { label: "Tanpa watermark", value: (f) => !f.watermark },
  {
    label: "Foto galeri",
    value: (f) => (f.galleryLimit === null ? "Tanpa batas" : `Maks. ${f.galleryLimit} foto`),
  },
  { label: "Penyimpanan foto & musik", value: (f) => mb(f.storageQuotaMb) },
  { label: "Link personal untuk tiap tamu", value: () => true },
  { label: "RSVP & ucapan tamu", value: (f) => f.rsvp && f.wishes },
  { label: "Peta lokasi acara", value: (f) => f.maps },
  { label: "Unggah musik sendiri", value: (f) => f.customMusic },
  { label: "Amplop digital & hadiah", value: (f) => f.digitalEnvelope },
  { label: "Daftar tamu & impor Excel", value: (f) => f.guestImportExcel, soon: true },
  { label: "Kirim WhatsApp massal", value: (f) => f.bulkWhatsapp, soon: true },
  { label: "QR check-in di lokasi", value: (f) => f.qrCheckIn, soon: true },
  { label: "Mode privat (kata sandi)", value: (f) => f.privateMode, soon: true },
  { label: "Dukungan prioritas", value: (f) => f.prioritySupport, soon: true },
];

/** Kalimat cara bayar (tergantung ada/tidaknya nomor WhatsApp). */
export const PAYMENT_TEXT = business.whatsapp
  ? "Pembayaran online (QRIS, transfer bank, e-wallet) segera hadir. Sementara itu, hubungi kami lewat WhatsApp untuk mengaktifkan paket berbayar."
  : "Pembayaran online (QRIS, transfer bank, e-wallet) segera hadir. Sementara itu, semua tema dan fitur bisa dicoba dengan paket Gratis.";

export const REFUND_TEXT =
  "Dana dikembalikan penuh bila diminta dalam 3 hari sejak pembayaran dan undangan belum pernah diterbitkan. Setelah undangan diterbitkan, dana tidak dapat dikembalikan, kecuali undangan tidak dapat diakses karena kesalahan layanan kami.";

const free = PACKAGES.FREE.features;
const photoMb = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Berapa lama undangan aktif?",
    a: `Paket Gratis aktif ${free.activeDays} hari sejak pertama kali diterbitkan (membatalkan terbit tidak menghentikan hitungan). Paket berbayar: ${PAID_ACTIVE.long.charAt(0).toLowerCase()}${PAID_ACTIVE.long.slice(1)}`,
  },
  { q: "Bagaimana cara bayar?", a: PAYMENT_TEXT },
  {
    q: "Apakah tema bisa diganti setelah undangan dibuat?",
    a: "Bisa, kapan saja dan berkali-kali. Semua isian (nama, acara, foto, musik) tetap tersimpan saat berganti tema. Beberapa tema membutuhkan paket tertentu agar bisa aktif penuh — semuanya tetap bisa dicoba gratis.",
  },
  {
    q: "Berapa foto yang bisa diunggah?",
    a: `Paket Gratis maksimal ${free.galleryLimit} foto galeri; paket berbayar tanpa batas jumlah selama kuota penyimpanan mencukupi (${PACKAGE_ORDER.filter(
      (t) => t !== "FREE",
    )
      .map((t) => `${PACKAGES[t].label} ${mb(PACKAGES[t].features.storageQuotaMb)}`)
      .join(
        ", ",
      )}). Ukuran tiap foto maksimal ${photoMb} MB; foto otomatis dikecilkan tanpa mengurangi kualitas tampilan, dan foto iPhone (HEIC) didukung.`,
  },
  {
    q: "Bisakah memakai musik sendiri?",
    a: `Semua paket bisa memilih lagu dari koleksi bawaan. Mulai paket ${PACKAGES[minTierFor("customMusic") ?? "BASIC"].label}, Anda bisa mengunggah musik sendiri (maksimal ${MAX_AUDIO_SECONDS / 60} menit, dikompres otomatis). Pastikan Anda berhak memakai musik yang diunggah.`,
  },
  {
    q: "Bagaimana data tamu saya dijaga?",
    a: "Halaman undangan tidak diindeks mesin pencari. Alamat IP tamu tidak disimpan mentah (hanya sidik acak harian untuk mencegah spam), dan Anda bisa menyembunyikan atau menghapus ucapan kapan saja dari editor. Data hanya dipakai untuk menjalankan undangan Anda.",
  },
  {
    q: "Apa yang terjadi setelah masa uji Gratis berakhir?",
    a: `Undangan tidak bisa dibuka tamu sampai paket ditingkatkan; tamu hanya melihat halaman "tidak aktif" tanpa data pribadi. Foto dan musik undangan Gratis dihapus otomatis ${MEDIA_RETENTION_DAYS} hari setelah masa uji berakhir.`,
  },
  { q: "Bisakah dana dikembalikan?", a: REFUND_TEXT },
];
