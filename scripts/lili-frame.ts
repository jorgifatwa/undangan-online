/**
 * Bingkai oval vintage tema Lili (hero & penutup) dari foto bingkai milik
 * pemilik (bingkai hijau di atas latar putih, mungkin di dalam screenshot):
 *
 *   pnpm tsx scripts/lili-frame.ts [.reference/lili/frame-source.png]
 *
 * 1. Potong panel putih (abaikan tepi abu screenshot).
 * 2. Latar putih → transparan (di luar bingkai & lubang foto): alfa dari
 *    "seberapa tidak putih" piksel, warna dipulihkan dari matte putih agar tepi
 *    tidak berpinggir putih.
 * 3. Potong ke kotak bingkai, ukur lubang oval (untuk posisi foto) dan tulis
 *    src/themes/lili/art/oval-frame.ts (ukuran & lubang, dibaca komponen).
 * 4. Simpan WebP beralfa → src/themes/lili/art/oval-frame.webp.
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/frame-source.png");
const OUT = path.resolve("src/themes/lili/art/oval-frame.webp");
const META = path.resolve("src/themes/lili/art/oval-frame.ts");
/** Lebar keluaran (px) — bingkai tampil ±280 px kanvas → tajam di layar 2×. */
const OUT_W = 620;

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const at = (x: number, y: number) => (y * W + x) * 3;
  const white = (x: number, y: number) => {
    const i = at(x, y);
    return data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240;
  };

  // 1. panel putih (kolom dekat kiri pasti melewati sudut panel yang putih)
  let pt = 0;
  while (!white(40, pt)) pt++;
  let pb = H - 1;
  while (!white(40, pb)) pb--;
  let pl = 0;
  while (!white(pl, pt + 3)) pl++;
  let pr = W - 1;
  while (!white(pr, pt + 3)) pr--;

  // 2. alfa + pemulihan warna dari matte putih
  const pw = pr - pl + 1;
  const ph = pb - pt + 1;
  const rgba = Buffer.alloc(pw * ph * 4);
  let x0 = pw;
  let y0 = ph;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const i = at(pl + x, pt + y);
      const c = [data[i], data[i + 1], data[i + 2]];
      const a = smooth(6, 46, 255 - Math.min(...c));
      const o = (y * pw + x) * 4;
      for (let k = 0; k < 3; k++)
        rgba[o + k] =
          a > 0.02 ? Math.round(Math.min(255, Math.max(0, (c[k] - 255 * (1 - a)) / a))) : 0;
      rgba[o + 3] = Math.round(a * 255);
      if (a > 0.5) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }

  // 3. kotak bingkai + lubang oval (pindai dari pusat ke empat arah)
  const fw = x1 - x0 + 1;
  const fh = y1 - y0 + 1;
  const alpha = (x: number, y: number) => rgba[(y * pw + x) * 4 + 3];
  const cx = Math.round(x0 + fw / 2);
  const cy = Math.round(y0 + fh / 2);
  let hl = cx;
  while (alpha(hl, cy) < 128) hl--;
  let hr = cx;
  while (alpha(hr, cy) < 128) hr++;
  let ht = cy;
  while (alpha(cx, ht) < 128) ht--;
  let hb = cy;
  while (alpha(cx, hb) < 128) hb++;

  const cropped = await sharp(rgba, { raw: { width: pw, height: ph, channels: 4 } })
    .extract({ left: x0, top: y0, width: fw, height: fh })
    .resize({ width: OUT_W })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toBuffer();
  fs.writeFileSync(OUT, cropped);

  // lubang dalam pecahan lebar/tinggi bingkai (0–1)
  const r4 = (v: number) => Math.round(v * 10000) / 10000;
  const hole = {
    cx: r4((hl + hr) / 2 / fw - x0 / fw),
    cy: r4((ht + hb) / 2 / fh - y0 / fh),
    rx: r4((hr - hl) / 2 / fw),
    ry: r4((hb - ht) / 2 / fh),
  };
  fs.writeFileSync(
    META,
    `// FILE DIBUAT OTOMATIS oleh scripts/lili-frame.ts — jangan diedit manual.\n` +
      `/** Rasio tinggi/lebar bingkai & lubang oval (pecahan lebar/tinggi bingkai). */\n` +
      `export const OVAL_FRAME = { ratio: ${r4(fh / fw)}, hole: ${JSON.stringify(hole)} } as const;\n`,
  );
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(
    `✓ ${path.relative(process.cwd(), OUT)} · ${kb} KB · bingkai ${fw}×${fh} · lubang ${JSON.stringify(hole)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
