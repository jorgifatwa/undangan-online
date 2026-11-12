/**
 * Batas upload (berlaku di browser & server). Kuota total per akun ada di
 * PackageFeatures.storageQuotaMb; jumlah foto galeri di galleryLimit.
 */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // sebelum kompresi
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // sebelum kompresi
/** Sisi terpanjang foto yang diterima (cegah gambar raksasa / bom dekompresi). */
export const MAX_PHOTO_SIDE = 8000;
/** Durasi musik maksimum setelah dipotong (detik). */
export const MAX_AUDIO_SECONDS = 15 * 60;
/** Maksimal upload yang menunggu proses sekaligus per akun. */
export const MAX_PENDING_UPLOADS = 20;

export const PHOTO_SLOTS = [
  "cover",
  "bride",
  "groom",
  "strip",
  "closing",
  "gallery",
  /** Potongan ulang foto galeri yang sudah ada (menggantikan, tidak menambah jumlah). */
  "gallery-crop",
  "loveStory",
  "celebrant",
  "qris",
] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

/** Sisi terpanjang hasil WebP per slot. */
export const PHOTO_MAX_SIDE: Record<PhotoSlot, number> = {
  cover: 1600,
  gallery: 1600,
  "gallery-crop": 1600,
  bride: 1200,
  groom: 1200,
  celebrant: 1200,
  strip: 1000,
  closing: 1200,
  loveStory: 1000,
  qris: 1000,
};

export const mb = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
