import "server-only";

import sharp from "sharp";

import { MAX_PHOTO_SIDE } from "./limits";

export class MediaError extends Error {}

/**
 * Foto → WebP terkompresi. Orientasi EXIF diterapkan lalu SEMUA metadata
 * (EXIF/GPS/lokasi) dibuang (sharp tidak menyalin metadata kecuali diminta).
 * Gambar > 8000 px di salah satu sisi atau > 64 MP ditolak sebelum di-decode penuh.
 */
export async function processPhoto(input: Buffer, maxSide: number) {
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PHOTO_SIDE * MAX_PHOTO_SIDE }).metadata();
  } catch {
    throw new MediaError("File foto rusak atau tidak bisa dibaca.");
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new MediaError("Ukuran foto tidak terbaca.");
  if (w > MAX_PHOTO_SIDE || h > MAX_PHOTO_SIDE)
    throw new MediaError(
      `Foto terlalu besar (${w}×${h} px). Maksimal ${MAX_PHOTO_SIDE} px per sisi.`,
    );
  if (w * h > 64_000_000) throw new MediaError("Foto terlalu besar (lebih dari 64 megapiksel).");

  try {
    const { data, info } = await sharp(input, { limitInputPixels: 64_000_000 })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new MediaError("Foto gagal diproses. Coba simpan ulang foto sebagai JPG.");
  }
}
