/// <reference lib="webworker" />
/**
 * Web Worker ML editor (TIDAK pernah dimuat di halaman tamu). Semua file dari
 * /ml/ milik sendiri — foto tidak pernah meninggalkan browser.
 *
 *  - "face":   deteksi wajah MediaPipe BlazeFace (Apache-2.0) → wajah terbesar
 *  - "cutout": hapus latar MODNet (Apache-2.0) lewat onnxruntime-web (MIT);
 *              mode "lite" / gagal → MediaPipe Selfie Segmenter (Apache-2.0)
 *
 * Model & runtime besar diunduh dengan progres lalu disimpan di Cache Storage
 * ("pk-ml-v1") sehingga hanya diunduh sekali.
 */
import type { MlRequest, MlResponse } from "./types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const CACHE = "pk-ml-v1";
const FILES = {
  modnet: { url: "/ml/models/modnet_quantized.onnx", bytes: 6_632_188 },
  ortWasm: { url: "/ml/runtime/ort-wasm-simd-threaded.wasm", bytes: 14_848_000 }, // ±3,7 MB terkompresi
  face: { url: "/ml/models/blaze_face_short_range.tflite", bytes: 229_746 },
  selfie: { url: "/ml/models/selfie_segmenter.tflite", bytes: 249_537 },
} as const;

const post = (m: MlResponse, transfer: Transferable[] = []) => ctx.postMessage(m, transfer);

/** Unduh (atau ambil dari cache) dengan laporan progres. */
async function fetchCached(url: string, onBytes?: (n: number) => void): Promise<ArrayBuffer> {
  // worker dimuat sebagai blob: → URL relatif tidak bisa di-resolve
  url = new URL(url, ctx.location.origin).href;
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (hit) {
      const buf = await hit.arrayBuffer();
      onBytes?.(buf.byteLength);
      return buf;
    }
  } catch {
    cache = null; // Cache Storage tidak tersedia (mode privat) → unduh biasa
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`gagal mengunduh ${url}`);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    got += value.byteLength;
    onBytes?.(got);
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.byteLength;
  }
  try {
    await cache?.put(url, new Response(out.slice().buffer));
  } catch {
    /* kuota cache penuh → tetap lanjut */
  }
  return out.buffer;
}

/* ------------------------------- MediaPipe -------------------------------- */

type Vision = typeof import("@mediapipe/tasks-vision");
let vision: Promise<{
  v: Vision;
  fileset: Awaited<ReturnType<Vision["FilesetResolver"]["forVisionTasks"]>>;
}> | null = null;
function mediapipe() {
  vision ??= (async () => {
    // MediaPipe memuat pemuat WASM lewat importScripts(), yang tidak bisa
    // memuat varian modul ES di worker modul. Pemuat dimuat sendiri dengan
    // import() lalu importScripts diganti shim yang memasang ModuleFactory
    // setiap kali diminta (MediaPipe mengosongkannya setelah tiap task dibuat).
    const loader = new URL("/ml/runtime/vision_wasm_module_internal.js", ctx.location.origin).href;
    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ loader)) as {
      default: unknown;
    };
    const g = ctx as unknown as {
      ModuleFactory?: unknown;
      importScripts: (...u: string[]) => void;
    };
    // HANYA pemuat MediaPipe yang dibelokkan; chunk bundler tetap lewat aslinya
    const original = g.importScripts.bind(g);
    g.importScripts = (...urls: string[]) => {
      if (urls.some((u) => u.includes("vision_wasm"))) g.ModuleFactory = mod.default;
      else original(...urls);
    };
    const v = await import("@mediapipe/tasks-vision");
    const fileset = await v.FilesetResolver.forVisionTasks(
      new URL("/ml/runtime", ctx.location.origin).href,
      true, // varian modul ES (worker modul)
    );
    return { v, fileset };
  })();
  return vision;
}

let faceDetector: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;
async function detectFace(bitmap: ImageBitmap) {
  faceDetector ??= (async () => {
    const { v, fileset } = await mediapipe();
    const model = new Uint8Array(await fetchCached(FILES.face.url));
    return v.FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate: "CPU" },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });
  })();
  const det = await faceDetector;
  const W = bitmap.width;
  const H = bitmap.height;
  const res = det.detect(bitmap);
  // wajah TERBESAR
  const best = res.detections
    .filter((d) => d.boundingBox)
    .sort(
      (a, b) =>
        b.boundingBox!.width * b.boundingBox!.height - a.boundingBox!.width * a.boundingBox!.height,
    )[0];
  if (!best?.boundingBox) return null;
  const bb = best.boundingBox;
  const kp = best.keypoints ?? [];
  // kemiringan kepala dari kedua mata (keypoint 0 = mata kanan, 1 = mata kiri)
  let roll = 0;
  if (kp.length >= 2) {
    const dx = (kp[1].x - kp[0].x) * W;
    const dy = (kp[1].y - kp[0].y) * H;
    roll = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (roll > 90) roll -= 180;
    if (roll < -90) roll += 180;
  }
  const cx = bb.originX + bb.width / 2;
  // kotak BlazeFace = alis–dagu; puncak kepala ± 0,45 × tinggi kotak di atasnya,
  // bergeser mengikuti kemiringan kepala
  const up = bb.height * 0.45;
  const rad = (roll * Math.PI) / 180;
  const topX = cx + Math.sin(rad) * up;
  const topY = bb.originY - Math.cos(rad) * up;
  return {
    x: (topX / W) * 100,
    y: (topY / H) * 100,
    w: (bb.width / W) * 100,
    r: roll,
    faces: res.detections.length,
  };
}

let selfie: Promise<import("@mediapipe/tasks-vision").ImageSegmenter> | null = null;
async function cutoutLite(bitmap: ImageBitmap): Promise<Float32Array> {
  selfie ??= (async () => {
    const { v, fileset } = await mediapipe();
    const model = new Uint8Array(await fetchCached(FILES.selfie.url));
    return v.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate: "CPU" },
      runningMode: "IMAGE",
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
  })();
  const seg = await selfie;
  const res = seg.segment(bitmap);
  const masks = res.confidenceMasks ?? [];
  // selfie_segmenter: 1 masker (orang); varian lain: [latar, orang]
  const m = masks.length > 1 ? masks[1] : masks[0];
  const out = m.getAsFloat32Array().slice();
  res.close();
  return out; // ukuran = ukuran gambar masukan
}

/* --------------------------------- MODNet --------------------------------- */

type Ort = typeof import("onnxruntime-web/wasm");
let modnet: Promise<{ ort: Ort; session: import("onnxruntime-web/wasm").InferenceSession }> | null =
  null;
function loadModnet(onProgress: (p: number) => void) {
  modnet ??= (async () => {
    const total = FILES.modnet.bytes + FILES.ortWasm.bytes;
    let a = 0;
    let b = 0;
    const report = () => onProgress(Math.min(1, (a + b) / total));
    const [model, wasm] = await Promise.all([
      fetchCached(FILES.modnet.url, (n) => ((a = n), report())),
      fetchCached(FILES.ortWasm.url, (n) => ((b = n), report())),
    ]);
    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.wasmPaths = new URL("/ml/runtime/", ctx.location.origin).href;
    ort.env.wasm.wasmBinary = wasm;
    ort.env.wasm.numThreads = 1; // tanpa COOP/COEP → satu thread (sudah di worker)
    ort.env.wasm.proxy = false;
    const session = await ort.InferenceSession.create(new Uint8Array(model), {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return { ort, session };
  })().catch((e) => {
    modnet = null;
    throw e;
  });
  return modnet;
}

async function cutoutModnet(
  bitmap: ImageBitmap,
  onProgress: (p: number) => void,
): Promise<Float32Array> {
  const { ort, session } = await loadModnet(onProgress);
  // praproses MODNet: sisi terpendek 512, kelipatan 32, (x/255 − 0,5)/0,5
  const s = 512 / Math.min(bitmap.width, bitmap.height);
  const w = Math.max(32, Math.round((bitmap.width * s) / 32) * 32);
  const h = Math.max(32, Math.round((bitmap.height * s) / 32) * 32);
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext("2d")!;
  g.drawImage(bitmap, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data;
  const input = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    input[i] = (px[i * 4] / 255 - 0.5) / 0.5;
    input[w * h + i] = (px[i * 4 + 1] / 255 - 0.5) / 0.5;
    input[2 * w * h + i] = (px[i * 4 + 2] / 255 - 0.5) / 0.5;
  }
  const feeds = { [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, h, w]) };
  const out = await session.run(feeds);
  const matte = out[session.outputNames[0]].data as Float32Array;
  // skala ke ukuran gambar asli
  const m = new OffscreenCanvas(w, h);
  const mg = m.getContext("2d")!;
  const img = mg.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = Math.max(0, Math.min(255, Math.round(matte[i] * 255)));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = v;
  }
  mg.putImageData(img, 0, 0);
  const big = new OffscreenCanvas(bitmap.width, bitmap.height);
  const bg = big.getContext("2d")!;
  bg.imageSmoothingQuality = "high";
  bg.drawImage(m, 0, 0, bitmap.width, bitmap.height);
  const a = bg.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const alpha = new Float32Array(bitmap.width * bitmap.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = a[i * 4 + 3] / 255;
  return alpha;
}

function largestComponent(alpha: Float32Array, W: number, H: number, t: number, grow: number) {
  const N = W * H;
  const lab = new Int32Array(N).fill(-1);
  const stack = new Int32Array(N);
  let best = -1,
    bestN = 0,
    cur = 0;
  for (let s0 = 0; s0 < N; s0++) {
    if (alpha[s0] <= t || lab[s0] !== -1) continue;
    let sp = 0,
      n = 0;
    stack[sp++] = s0;
    lab[s0] = cur;
    while (sp) {
      const p = stack[--sp];
      n++;
      const x = p % W;
      const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W];
      for (const q of nb)
        if (q >= 0 && q < N && lab[q] === -1 && alpha[q] > t) {
          lab[q] = cur;
          stack[sp++] = q;
        }
    }
    if (n > bestN) {
      bestN = n;
      best = cur;
    }
    cur++;
  }
  let k = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (lab[i] === best) k[i] = 1;
  for (let r = 0; r < grow; r++) {
    const nk = new Uint8Array(k);
    for (let i = 0; i < N; i++) {
      if (k[i]) continue;
      const x = i % W;
      if (
        (x > 0 && k[i - 1]) ||
        (x < W - 1 && k[i + 1]) ||
        (i >= W && k[i - W]) ||
        (i < N - W && k[i + W])
      )
        nk[i] = 1;
    }
    k = nk;
  }
  return k;
}

/** Erosi masker biner (r langkah, 4-tetangga). */
function erode(k: Uint8Array, W: number, H: number, r: number) {
  const inv = new Uint8Array(k.length);
  for (let i = 0; i < k.length; i++) inv[i] = k[i] ? 0 : 1;
  const d = dilate(inv, W, H, r);
  for (let i = 0; i < k.length; i++) d[i] = d[i] ? 0 : 1;
  return d;
}

/** Dilatasi masker biner (r langkah, 4-tetangga). */
function dilate(k: Uint8Array, W: number, H: number, r: number): Uint8Array {
  const N = W * H;
  for (let t = 0; t < r; t++) {
    const nk = new Uint8Array(k);
    for (let i = 0; i < N; i++) {
      if (k[i]) continue;
      const x = i % W;
      if (
        (x > 0 && k[i - 1]) ||
        (x < W - 1 && k[i + 1]) ||
        (i >= W && k[i - W]) ||
        (i < N - W && k[i + W])
      )
        nk[i] = 1;
    }
    k = nk;
  }
  return k;
}

/**
 * Gabungkan MODNet (m, tepi halus) & Selfie Segmenter (s, badan padat):
 *  - inti = s > 0,8 dikikis ±1 % → padat (lubang MODNet di pakaian gelap tertutup)
 *  - MODNet dipakai di sekitar inti saja (±1,5 % sisi gambar) →
 *    rambut/tepi halus tetap, noda jauh (mis. dekorasi di latar) dibuang
 *  - lubang tertutup kecil (< 1,5 % gambar) di dalam subjek diisi
 */
function fuse(m: Float32Array, s: Float32Array, W: number, H: number): Float32Array {
  const N = W * H;
  const side = Math.min(W, H);
  // inti yakin: s > 0,8, dikikis ±1 % sisi (tepi selfie kasar & sering membawa latar)
  let core: Uint8Array = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (s[i] > 0.8) core[i] = 1;
  core = erode(core, W, H, Math.max(2, Math.round(side * 0.01)));
  // MODNet hanya di sekitar inti (±1,5 % sisi)
  const near = dilate(core, W, H, Math.max(4, Math.round(side * 0.015)));
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = core[i] ? 1 : near[i] ? m[i] : 0;
  // isi lubang tertutup kecil: piksel transparan yang tidak terhubung ke tepi gambar
  const seen = new Uint8Array(N);
  const stack = new Int32Array(N);
  const hole = (i: number) => out[i] < 0.5;
  for (let s0 = 0; s0 < N; s0++) {
    if (seen[s0] || !hole(s0)) continue;
    let sp = 0;
    const comp: number[] = [];
    let touches = false;
    stack[sp++] = s0;
    seen[s0] = 1;
    while (sp) {
      const p = stack[--sp];
      comp.push(p);
      const x = p % W;
      const y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W])
        if (q >= 0 && q < N && !seen[q] && hole(q)) {
          seen[q] = 1;
          stack[sp++] = q;
        }
    }
    if (!touches && comp.length < N * 0.015) for (const p of comp) out[p] = 1;
  }
  return out;
}

/** Terapkan masker alpha → gambar beralpha (dipangkas ke subjek), WebP/PNG. */
async function compose(
  bitmap: ImageBitmap,
  alpha: Float32Array,
  mode: "modnet" | "lite",
): Promise<{ blob: Blob; crop: { x: number; y: number; w: number; h: number } }> {
  // Selfie Segmenter lebih kabur di tepi → ambang lebih ketat agar sisa latar hilang
  const [lo, hi] = mode === "lite" ? [0.5, 0.85] : [0.12, 0.9];
  const W = bitmap.width;
  const H = bitmap.height;
  const c = new OffscreenCanvas(W, H);
  const g = c.getContext("2d")!;
  g.drawImage(bitmap, 0, 0);
  const d = g.getImageData(0, 0, W, H);
  // Hanya subjek utama: komponen terhubung terbesar (alpha > 0,5) dipertahankan,
  // pulau sisa latar dibuang. Tepi halus di sekitarnya tetap (dilatasi 4 px).
  const keep = largestComponent(alpha, W, H, 0.5, 4);
  let minX = W,
    minY = H,
    maxX = 0,
    maxY = 0,
    on = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // ambang lembut: buang sisa latar tipis, pertahankan tepi rambut
      const a = !keep[i] ? 0 : alpha[i] < lo ? 0 : alpha[i] > hi ? 1 : (alpha[i] - lo) / (hi - lo);
      d.data[i * 4 + 3] = Math.round(a * 255);
      if (a > 0.5) {
        on++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  if (on < W * H * 0.01) throw new Error("subjek tidak ditemukan");
  g.putImageData(d, 0, 0);
  // pangkas ke subjek (+ sedikit ruang); crop dikirim agar posisi wajah/topi bisa
  // dipetakan ulang ke koordinat gambar baru
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03);
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(W, maxX + pad + 1);
  const y1 = Math.min(H, maxY + pad + 1);
  const o = new OffscreenCanvas(x1 - x0, y1 - y0);
  o.getContext("2d")!.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
  const crop = {
    x: (x0 / W) * 100,
    y: (y0 / H) * 100,
    w: ((x1 - x0) / W) * 100,
    h: ((y1 - y0) / H) * 100,
  };
  let blob: Blob;
  try {
    blob = await o.convertToBlob({ type: "image/webp", quality: 0.92 });
  } catch {
    blob = await o.convertToBlob({ type: "image/png" });
  }
  return { blob, crop };
}

ctx.onmessage = async (e: MessageEvent<MlRequest>) => {
  const req = e.data;
  try {
    if (req.type === "face") {
      const face = await detectFace(req.bitmap);
      req.bitmap.close();
      post({ id: req.id, type: "face", face });
    } else if (req.type === "cutout") {
      const t0 = performance.now();
      const lite = async () => compose(req.bitmap, await cutoutLite(req.bitmap), "lite");
      let mode: "modnet" | "lite" = req.mode;
      let blob: Awaited<ReturnType<typeof compose>>;
      if (mode === "modnet") {
        try {
          const m = await cutoutModnet(req.bitmap, (p) =>
            post({ id: req.id, type: "progress", progress: p }),
          );
          // Gabungan: badan dari Selfie Segmenter (padat — MODNet bisa berlubang
          // pada pakaian gelap di latar gelap), tepi halus (rambut) dari MODNet
          // hanya di dekat tubuh. Selfie gagal → MODNet saja.
          let alpha = m;
          try {
            alpha = fuse(m, await cutoutLite(req.bitmap), req.bitmap.width, req.bitmap.height);
          } catch {
            /* tetap MODNet */
          }
          blob = await compose(req.bitmap, alpha, "modnet");
        } catch (err) {
          // gagal dimuat / gagal alokasi memori / gagal memproses / hasil kosong → mode ringan
          post({ id: req.id, type: "fallback", reason: String(err).slice(0, 200) });
          mode = "lite";
          blob = await lite();
        }
      } else blob = await lite();
      req.bitmap.close();
      post({
        id: req.id,
        type: "cutout",
        blob: blob.blob,
        crop: blob.crop,
        mode,
        ms: Math.round(performance.now() - t0),
      });
    }
  } catch (err) {
    post({ id: req.id, type: "error", error: String(err).slice(0, 300) });
  }
};
