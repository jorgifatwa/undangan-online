/**
 * Aset ML yang DI-HOST SENDIRI di /ml/ (tidak ada CDN pihak ketiga; foto
 * pengguna tidak pernah meninggalkan browser):
 *  - public/ml/models/ (di repo, diverifikasi checksum di bawah):
 *      modnet_quantized.onnx         MODNet (Apache-2.0) — hapus latar
 *      blaze_face_short_range.tflite BlazeFace (Apache-2.0) — deteksi wajah
 *      selfie_segmenter.tflite       Selfie Segmenter (Apache-2.0) — hapus latar mode ringan
 *  - public/ml/runtime/ (gitignored) — disalin dari node_modules:
 *      onnxruntime-web (MIT) & @mediapipe/tasks-vision (Apache-2.0) WASM
 *
 *   pnpm ml:assets        (otomatis di predev & prebuild)
 *
 * Hanya editor yang memuat file ini (tombol "Hapus latar otomatis" &
 * deteksi wajah setelah foto diunggah). Halaman tamu TIDAK pernah.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MODELS: Record<string, string> = {
  "modnet_quantized.onnx": "92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a",
  "blaze_face_short_range.tflite":
    "b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f",
  "selfie_segmenter.tflite": "191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b",
};
const RUNTIME: [pkg: string, file: string][] = [
  ["onnxruntime-web/dist", "ort-wasm-simd-threaded.wasm"],
  ["onnxruntime-web/dist", "ort-wasm-simd-threaded.mjs"],
  ["@mediapipe/tasks-vision/wasm", "vision_wasm_module_internal.js"],
  ["@mediapipe/tasks-vision/wasm", "vision_wasm_module_internal.wasm"],
];

let bad = 0;
for (const [name, sum] of Object.entries(MODELS)) {
  const f = path.join(ROOT, "public/ml/models", name);
  if (!fs.existsSync(f)) {
    console.error(`✗ model hilang: public/ml/models/${name}`);
    bad++;
    continue;
  }
  const got = crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  if (got !== sum) {
    console.error(`✗ checksum model tidak cocok: ${name}`);
    bad++;
  }
}
const out = path.join(ROOT, "public/ml/runtime");
fs.mkdirSync(out, { recursive: true });
for (const [pkg, file] of RUNTIME) {
  const src = path.join(ROOT, "node_modules", pkg, file);
  if (!fs.existsSync(src)) {
    console.error(`✗ runtime tidak ditemukan: ${pkg}/${file} (jalankan pnpm install)`);
    bad++;
    continue;
  }
  fs.copyFileSync(src, path.join(out, file));
}
if (bad) process.exit(1);
console.log(
  `✓ ml:assets — ${Object.keys(MODELS).length} model terverifikasi, ${RUNTIME.length} file runtime → public/ml/runtime/`,
);
