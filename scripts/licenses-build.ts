/**
 * Berkas lisensi pihak ketiga untuk /lisensi → public/licenses/ (gitignored,
 * dibuat ulang di predev & prebuild):
 *   NOTICE.txt                       atribusi (Apache-2.0 §4) model & runtime ML
 *   apache-2.0.txt                   teks lengkap Apache License 2.0
 *   mediapipe.txt, modnet.txt        lisensi model (Apache-2.0)
 *   onnxruntime.txt (+ third-party)  onnxruntime-web (MIT) & ThirdPartyNotices
 *   fonts/*.txt                      SIL Open Font License tiap font
 *   npm/*.txt                        lisensi library yang dimuat di browser
 * Teks upstream yang tidak ikut paket npm disimpan di licenses/vendor/.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/licenses");
const V = (f: string) => fs.readFileSync(path.join(ROOT, "licenses/vendor", f), "utf8");

/** Library yang ikut terkirim ke browser (halaman tamu / editor). */
export const CLIENT_LIBS = [
  "next",
  "react",
  "react-dom",
  "framer-motion",
  "lucide-react",
  "sonner",
  "zod",
  "react-hook-form",
  "@hookform/resolvers",
  "react-easy-crop",
  "heic2any",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "radix-ui",
  "next-auth",
  "date-fns",
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
fs.mkdirSync(path.join(OUT, "npm"), { recursive: true });

fs.writeFileSync(
  path.join(OUT, "NOTICE.txt"),
  `Undangan Online — atribusi komponen pihak ketiga (Apache License 2.0, bagian 4)

Bagian editor undangan (deteksi wajah untuk topi pesta & "Hapus latar otomatis")
memakai komponen berikut. Semua diproses di perangkat pengguna; foto tidak
dikirim ke layanan pihak ketiga. Halaman undangan tamu tidak memuat komponen ini.

1. MediaPipe Tasks Vision (@mediapipe/tasks-vision)
   Copyright Google LLC. Licensed under the Apache License, Version 2.0.
   https://github.com/google-ai-edge/mediapipe

2. BlazeFace (short range) & Selfie Segmenter — model MediaPipe
   Copyright Google LLC. Licensed under the Apache License, Version 2.0
   (lihat model card resmi di https://ai.google.dev/edge/mediapipe).

3. MODNet: Trimap-Free Portrait Matting (ZHKKKe/MODNet), bobot ONNX terkuantisasi
   (Xenova/modnet). Licensed under the Apache License, Version 2.0.
   https://github.com/ZHKKKe/MODNet — https://huggingface.co/Xenova/modnet
   Perubahan: bobot dipakai apa adanya (konversi ONNX terkuantisasi pihak Xenova);
   praproses & pascaproses ditulis ulang untuk aplikasi ini.

4. ONNX Runtime Web (onnxruntime-web)
   Copyright (c) Microsoft Corporation. Licensed under the MIT License.
   https://github.com/microsoft/onnxruntime — pemberitahuan pihak ketiga:
   onnxruntime-third-party-notices.txt

Teks lengkap Apache License 2.0: apache-2.0.txt
`,
);
fs.writeFileSync(path.join(OUT, "apache-2.0.txt"), V("mediapipe-LICENSE.txt"));
fs.writeFileSync(path.join(OUT, "mediapipe.txt"), V("mediapipe-LICENSE.txt"));
fs.writeFileSync(path.join(OUT, "modnet.txt"), V("modnet-LICENSE.txt"));
fs.writeFileSync(path.join(OUT, "onnxruntime.txt"), V("onnxruntime-LICENSE.txt"));
fs.writeFileSync(
  path.join(OUT, "onnxruntime-third-party-notices.txt"),
  V("onnxruntime-ThirdPartyNotices.txt"),
);

for (const f of fs.readdirSync(path.join(ROOT, "src/themes/_fonts/licenses")))
  fs.copyFileSync(path.join(ROOT, "src/themes/_fonts/licenses", f), path.join(OUT, "fonts", f));

let n = 0;
for (const lib of CLIENT_LIBS) {
  const dir = path.join(ROOT, "node_modules", lib);
  const file = fs.readdirSync(dir).find((x) => /^licen[cs]e(\.md|\.txt)?$/i.test(x));
  if (!file) continue;
  fs.writeFileSync(
    path.join(OUT, "npm", `${lib.replace("/", "__")}.txt`),
    fs.readFileSync(path.join(dir, file)),
  );
  n++;
}
console.log(
  `✓ licenses:build — NOTICE + ${fs.readdirSync(path.join(OUT, "fonts")).length} font + ${n} library → public/licenses/`,
);
