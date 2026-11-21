/**
 * Kartu renda persegi (doily) Love Story tema Lili dari gambar milik pemilik
 * (doily krem di atas latar hijau bertekstur):
 *
 *   pnpm tsx scripts/lili-doily.ts [.reference/lili/doily-source.jpg]
 *
 * 1. Latar hijau → transparan (color key: hijau r − g ≈ −17, krem ≥ +5);
 *    warna tepi dipulihkan dari matte hijau agar tidak berpinggir hijau.
 * 2. Potong ke kotak doily → src/themes/lili/art/doily.webp.
 * 3. Kartu dipasang sebagai 9-slice (CSS border-image): sudut tetap, tepi
 *    renda diulang, tengah krem meregang mengikuti isi. Batas irisan (px
 *    gambar hasil) ditulis ke doily.ts.
 * Latar hijau dibuat ulang di tema (tekstur CSS), tidak diambil dari gambar.
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/doily-source.jpg");
const OUT = path.resolve("src/themes/lili/art/doily.webp");
const META = path.resolve("src/themes/lili/art/doily.ts");
/** Kotak doily & persegi krem bagian dalam di gambar sumber (675 × 1200). */
const BOX = { l: 100, t: 270, r: 584, b: 978 };
const INNER = { l: 172, t: 343, r: 512, b: 905 };

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const green = [58, 77, 46];
  const w = BOX.r - BOX.l + 1;
  const h = BOX.b - BOX.t + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((BOX.t + y) * W + BOX.l + x) * 3;
      const c = [data[i], data[i + 1], data[i + 2]];
      // krem terang & r ≥ g; hijau gelap & g > r
      const a = Math.min(smooth(-13, 2, c[0] - c[1]), smooth(95, 150, c[0]));
      const o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++)
        out[o + k] =
          a > 0.04 ? Math.round(Math.min(255, Math.max(0, (c[k] - green[k] * (1 - a)) / a))) : 0;
      out[o + 3] = Math.round(a * 255);
    }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 92, effort: 6 })
    .toFile(OUT);
  const slice = {
    w,
    h,
    l: INNER.l - BOX.l,
    t: INNER.t - BOX.t,
    r: BOX.r - INNER.r,
    b: BOX.b - INNER.b,
  };
  fs.writeFileSync(
    META,
    `// FILE DIBUAT OTOMATIS oleh scripts/lili-doily.ts — jangan diedit manual.\n` +
      `/** Ukuran gambar doily & lebar irisan 9-slice (px gambar). */\n` +
      `export const DOILY = ${JSON.stringify(slice)} as const;\n`,
  );
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(
    `✓ ${path.relative(process.cwd(), OUT)} ${w}×${h} · ${kb} KB · irisan ${JSON.stringify(slice)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
