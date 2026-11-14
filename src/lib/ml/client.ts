"use client";

import type { FaceResult, MlRequest, MlResponse } from "./types";

/**
 * Klien Web Worker ML — HANYA diimpor dinamis oleh editor (deteksi wajah
 * setelah foto diunggah, tombol "Hapus latar otomatis"). Halaman tamu tidak
 * pernah memuat modul ini, worker, maupun file /ml/.
 */
let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (m: MlResponse) => void>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./ml.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<MlResponse>) => pending.get(e.data.id)?.(e.data);
    worker.onerror = () => {
      for (const cb of pending.values()) cb({ id: -1, type: "error", error: "worker gagal" });
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/** Gambar foto (URL publik / media) sebagai ImageBitmap lewat optimizer Next (satu origin). */
async function bitmapOf(url: string, maxSide = 1200): Promise<ImageBitmap> {
  const src = url.startsWith("/_next/")
    ? url
    : `/_next/image?url=${encodeURIComponent(url)}&w=${maxSide}&q=90`;
  const r = await fetch(src);
  if (!r.ok) throw new Error("foto tidak bisa dibaca");
  return createImageBitmap(await r.blob());
}

type NoId<T> = T extends unknown ? Omit<T, "id"> : never;

function call(req: NoId<MlRequest>, onMsg?: (m: MlResponse) => void): Promise<MlResponse> {
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, (m) => {
      if (m.type === "progress" || m.type === "fallback") return onMsg?.(m);
      pending.delete(id);
      resolve(m);
    });
    const r = { ...req, id } as MlRequest;
    getWorker().postMessage(r, [r.bitmap]);
  });
}

/** Wajah terbesar pada foto (persen relatif foto), null bila tidak ada. */
export async function detectFace(url: string): Promise<FaceResult | null> {
  const bitmap = await bitmapOf(url, 1080);
  const res = await call({ type: "face", bitmap });
  if (res.type === "face") return res.face;
  throw new Error(res.type === "error" ? res.error : "deteksi wajah gagal");
}

/** Perangkat lemah → langsung mode ringan (MODNet butuh ±300 MB memori). */
export function weakDevice() {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return mem !== undefined && mem <= 2;
}

export interface CutoutResult {
  blob: Blob;
  crop: import("./types").CropBox;
  mode: "modnet" | "lite";
  ms: number;
  fellBack: boolean;
}

/** Hapus latar: MODNet (cadangan otomatis: Selfie Segmenter). */
export async function removeBackground(
  url: string,
  opts: { lite: boolean; onProgress?: (p: number) => void },
): Promise<CutoutResult> {
  const bitmap = await bitmapOf(url, 1200);
  let fellBack = false;
  const res = await call({ type: "cutout", bitmap, mode: opts.lite ? "lite" : "modnet" }, (m) => {
    if (m.type === "progress") opts.onProgress?.(m.progress);
    if (m.type === "fallback") fellBack = true;
  });
  if (res.type === "cutout")
    return { blob: res.blob, crop: res.crop, mode: res.mode, ms: res.ms, fellBack };
  throw new Error(res.type === "error" ? res.error : "hapus latar gagal");
}

/** Model hapus latar sudah tersimpan di perangkat? (lewati dialog ukuran unduhan) */
export async function cutoutCached() {
  try {
    const c = await caches.open("pk-ml-v1");
    return !!(await c.match(new URL("/ml/models/modnet_quantized.onnx", location.origin).href));
  } catch {
    return false;
  }
}
