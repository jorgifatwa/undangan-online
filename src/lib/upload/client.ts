"use client";

import {
  finalizePhotoAction,
  markAudioUploadedAction,
  requestUploadAction,
} from "@/app/(dashboard)/dashboard/undangan/[id]/edit/media-actions";
import { MAX_AUDIO_BYTES, MAX_PHOTO_BYTES, mb } from "@/lib/media/limits";

/**
 * Upload dari browser: foto disiapkan (HEIC → JPEG, crop) di sini, lalu
 * file mentah di-PUT langsung ke penyimpanan (R2 presigned / route lokal)
 * dengan progres, kemudian server memvalidasi & mengompres (finalize).
 */
export class ClientUploadError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** HEIC/HEIF dari isi file (iPhone), bukan dari nama/tipe yang sering kosong. */
export async function isHeic(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const s = String.fromCharCode(...head);
  return (
    s.slice(4, 8) === "ftyp" && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(s.slice(8, 12))
  );
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas kosong"))),
      "image/jpeg",
      quality,
    ),
  );
}

/**
 * HEIC → JPEG di browser (server tidak bisa men-decode HEVC):
 *  1. Safari 17+ (iPhone/Mac) bisa men-decode HEIC sendiri → createImageBitmap
 *  2. browser lain → heic2any (±1 MB, dimuat HANYA saat dibutuhkan)
 */
export async function heicToJpeg(file: Blob): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext("2d")!.drawImage(bmp, 0, 0);
    bmp.close();
    return await canvasToJpeg(c);
  } catch {
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return Array.isArray(out) ? out[0] : out;
  }
}

/** Pastikan file benar-benar bisa dibuka sebagai gambar (bukan hanya bernama .jpg). */
async function assertDecodable(blob: Blob) {
  try {
    const bmp = await createImageBitmap(blob);
    bmp.close();
  } catch {
    throw new ClientUploadError(
      "File ini bukan foto yang bisa dibuka (JPG, PNG, WebP, atau HEIC).",
    );
  }
}

/** Siapkan foto: HEIC dikonversi; file lain dicek bisa dibuka sebagai gambar. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (file.size > MAX_PHOTO_BYTES * 2)
    throw new ClientUploadError(`Foto terlalu besar (maks. ${mb(MAX_PHOTO_BYTES)}).`);
  if (!(await isHeic(file))) {
    await assertDecodable(file);
    return file;
  }
  {
    try {
      return await heicToJpeg(file);
    } catch {
      throw new ClientUploadError(
        "Foto HEIC tidak bisa dibuka di browser ini. Ubah ke JPG (Pengaturan iPhone → Kamera → Format → Paling Kompatibel) lalu coba lagi.",
      );
    }
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ClientUploadError("Foto tidak bisa dibuka."));
    img.src = src;
  });
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Potong (hasil react-easy-crop, piksel) → JPEG, sisi terpanjang ≤ maxSide. */
export async function cropToBlob(src: string, area: Area, maxSide = 2400): Promise<Blob> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  const c = document.createElement("canvas");
  c.width = Math.round(area.width * scale);
  c.height = Math.round(area.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, c.width, c.height);
  return canvasToJpeg(c);
}

function put(
  url: string,
  headers: Record<string, string>,
  body: Blob,
  onProgress?: (p: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new ClientUploadError(
              xhr.status === 413 ? "File terlalu besar." : "Unggahan gagal. Coba lagi.",
            ),
          );
    xhr.onerror = () => reject(new ClientUploadError("Koneksi terputus saat mengunggah."));
    xhr.send(body);
  });
}

async function upload(
  invitationId: string,
  kind: "PHOTO" | "AUDIO",
  slot: string,
  blob: Blob,
  onProgress?: (p: number) => void,
  rightsAccepted?: boolean,
) {
  const contentType = blob.type || "application/octet-stream";
  const req = await requestUploadAction(invitationId, {
    kind,
    slot,
    contentType,
    size: blob.size,
    rightsAccepted,
  });
  if (!req.ok) throw new ClientUploadError(req.error, req.code);
  await put(req.target.url, req.target.headers, blob, onProgress);
  return req.mediaId;
}

/** Foto: upload + kompres WebP di server. Progres 0–0.9 = unggah, 1 = selesai. */
export async function uploadPhoto(
  invitationId: string,
  slot: string,
  blob: Blob,
  onProgress?: (p: number) => void,
) {
  const mediaId = await upload(invitationId, "PHOTO", slot, blob, (p) => onProgress?.(p * 0.9));
  const fin = await finalizePhotoAction(mediaId);
  if (!fin.ok) throw new ClientUploadError(fin.error, fin.code);
  onProgress?.(1);
  return fin;
}

/** Musik: upload + tandai siap diproses + picu proses asinkron (tidak ditunggu). */
export async function uploadMusic(
  invitationId: string,
  file: File,
  rightsAccepted: boolean,
  onProgress?: (p: number) => void,
) {
  if (file.size > MAX_AUDIO_BYTES)
    throw new ClientUploadError(`Musik maksimal ${mb(MAX_AUDIO_BYTES)}.`);
  const mediaId = await upload(invitationId, "AUDIO", "music", file, onProgress, rightsAccepted);
  const mark = await markAudioUploadedAction(mediaId);
  if (!mark.ok) throw new ClientUploadError(mark.error, mark.code);
  // Kompresi berjalan di route terpisah (maxDuration panjang); status dipantau lewat polling.
  void fetch(`/api/media/${mediaId}/process`, { method: "POST" }).catch(() => undefined);
  return mediaId;
}
