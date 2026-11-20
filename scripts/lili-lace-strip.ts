/**
 * Pita renda LURUS (tegak) tema Lili — tepi kanan section Ucapan — dari foto
 * renda milik pemilik (strip tegak, latar hitam):
 *
 *   pnpm tsx scripts/lili-lace-strip.ts [.reference/lili/lace-source.png]
 *
 * 1. Cari batas strip; ambil segmen setinggi PERIOD (2 × periode motif ±414 px,
 *    diukur dengan autokorelasi) + OVERLAP.
 * 2. Ubin mulus: OVERLAP baris terakhir dipadukan (crossfade) ke baris awal,
 *    jadi `background-repeat: repeat-y` tanpa sambungan terlihat.
 * 3. Latar hitam → alfa (seperti scripts/lili-lace.ts), simpan WebP →
 *    src/themes/lili/art/lace-strip.webp.
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/lace-source.png");
const OUT = path.resolve("src/themes/lili/art/lace-strip.webp");
const START = 200;
const PERIOD = 828;
const OVERLAP = 90;
/** Lebar keluaran (px) — tampil ±46 px kanvas → tajam di layar 3×. */
const OUT_W = 150;

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function main() {
  const { data, info } = await sharp(SRC)
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  if (START + PERIOD + OVERLAP > H) throw new Error("Foto renda terlalu pendek.");

  const col = new Float64Array(W);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x++) col[x] += data[y * W + x];
  const max = Math.max(...col);
  let l = 0;
  let r = W - 1;
  while (col[l] < max * 0.06) l++;
  while (col[r] < max * 0.06) r--;
  l = Math.max(0, l - 4);
  r = Math.min(W - 1, r + 4);
  const sw = r - l + 1;

  const rgba = Buffer.alloc(sw * PERIOD * 4);
  for (let y = 0; y < PERIOD; y++)
    for (let x = 0; x < sw; x++) {
      let v = data[(START + y) * W + l + x];
      if (y < OVERLAP) {
        // awal ubin = paduan baris awal & baris sesudah PERIOD (yang menyambung ke bawah)
        const t = y / OVERLAP;
        const tail = data[(START + PERIOD + y) * W + l + x];
        v = v * t + tail * (1 - t);
      }
      const a = smooth(22, 190, v);
      const c = smooth(40, 235, v);
      const i = (y * sw + x) * 4;
      rgba[i] = Math.round(216 + 35 * c);
      rgba[i + 1] = Math.round(211 + 38 * c);
      rgba[i + 2] = Math.round(198 + 45 * c);
      rgba[i + 3] = Math.round(a * 255);
    }

  await sharp(rgba, { raw: { width: sw, height: PERIOD, channels: 4 } })
    .resize({ width: OUT_W })
    .webp({ quality: 74, alphaQuality: 85, effort: 6 })
    .toFile(OUT);
  const m = await sharp(OUT).metadata();
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(`✓ ${path.relative(process.cwd(), OUT)} ${m.width}×${m.height} · ${kb} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
