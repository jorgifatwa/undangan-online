import "server-only";

import sharp from "sharp";

import { storage } from "@/lib/storage";
import type { Photo } from "@/schemas";

/** Lebar panel foto di gambar pratinjau (tinggi = 630). */
export const OG_PHOTO = { width: 470, height: 630 } as const;

/**
 * Foto cover → data URI JPEG berukuran panel, dipotong mengikuti titik fokus
 * yang dipilih pemilik. HANYA dari penyimpanan kita sendiri (bukan URL bebas →
 * tidak bisa dipakai untuk memancing server mengambil alamat lain).
 * null bila tidak ada / gagal dibaca → pakai versi teks.
 */
export async function coverPhotoDataUri(photo: Photo | undefined): Promise<string | null> {
  if (!photo?.url) return null;
  const key = storage().keyFromUrl(photo.url);
  if (!key) return null;
  try {
    const buf = await storage().get(key);
    if (!buf) return null;
    // rotate(): ikuti orientasi EXIF dulu, baru ukur & potong
    const { data, info } = await sharp(buf, { failOn: "none" })
      .rotate()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    if (!width || !height) return null;
    // Potongan seluas mungkin dengan rasio panel, berpusat di titik fokus.
    const ratio = OG_PHOTO.width / OG_PHOTO.height;
    const cw = Math.min(width, Math.round(height * ratio));
    const ch = Math.min(height, Math.round(cw / ratio));
    const fx = ((photo.focusX ?? 50) / 100) * width;
    const fy = ((photo.focusY ?? 50) / 100) * height;
    const left = Math.max(0, Math.min(width - cw, Math.round(fx - cw / 2)));
    const top = Math.max(0, Math.min(height - ch, Math.round(fy - ch / 2)));
    const out = await sharp(data)
      .extract({ left, top, width: cw, height: ch })
      .resize(OG_PHOTO.width, OG_PHOTO.height)
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}
