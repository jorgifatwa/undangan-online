/**
 * Ubin kolom bunga tema Lili (FloralColumn) dari kolom bunga milik pemilik
 * (PNG transparan, 3 ulangan alstroemeria → lili → anggrek hijau):
 *
 *   pnpm tsx scripts/lili-floral-column.ts [.reference/lili/floral-column.png]
 *
 * Ubin = satu periode motif (±207 px, diukur dengan autokorelasi) yang
 * dipotong di TENGAH anggrek; anggrek tiap ulangan hampir identik, jadi
 * OVERLAP baris awal dipadukan (crossfade) dengan baris sesudah satu periode
 * → `repeat-y` tanpa sambungan dan tanpa bunga terpotong.
 * Hasil: src/themes/lili/art/floral-column.webp.
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/floral-column.png");
const OUT = path.resolve("src/themes/lili/art/floral-column.webp");
/** Kolom bunga di foto sumber (x) dan awal ubin (tengah anggrek pertama). */
const X0 = 168;
const START = 110;
const PERIOD = 207;
const OVERLAP = 44;

async function main() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const cw = W - X0;
  if (START + PERIOD + OVERLAP > info.height) throw new Error("Gambar kolom terlalu pendek.");
  const out = Buffer.alloc(cw * PERIOD * 4);
  for (let y = 0; y < PERIOD; y++)
    for (let x = 0; x < cw; x++) {
      const i = ((START + y) * W + X0 + x) * 4;
      const o = (y * cw + x) * 4;
      if (y < OVERLAP + 12 && x < 82) {
        // sisa tangkai gladiol di kiri sambungan → buang (jadi bayangan samar)
        out[o + 3] = 0;
      } else if (y < OVERLAP) {
        // paduan premultiplied: awal ubin ← baris sesudah satu periode (bawah ubin menyambung)
        const t = y / OVERLAP;
        const j = ((START + PERIOD + y) * W + X0 + x) * 4;
        const a1 = data[i + 3] * t;
        const a2 = data[j + 3] * (1 - t);
        const a = a1 + a2;
        for (let k = 0; k < 3; k++)
          out[o + k] = a > 0 ? Math.round((data[i + k] * a1 + data[j + k] * a2) / a) : 0;
        out[o + 3] = Math.round(a);
      } else {
        for (let k = 0; k < 4; k++) out[o + k] = data[i + k];
      }
    }
  await sharp(out, { raw: { width: cw, height: PERIOD, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 95, effort: 6 })
    .toFile(OUT);
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(`✓ ${path.relative(process.cwd(), OUT)} ${cw}×${PERIOD} · ${kb} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
