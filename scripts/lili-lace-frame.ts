/**
 * Bingkai renda foto mempelai tema Lili dari gambar milik pemilik (JPG dengan
 * pola kotak-kotak "transparan" yang ikut tercetak):
 *
 *   pnpm tsx scripts/lili-lace-frame.ts [.reference/lili/lace-frame.jpg]
 *
 * 1. Kotak-kotak = abu netral (r = g = b, 180–240) — renda putih selalu sedikit
 *    pink atau putih penuh (≥ 250), jadi bisa dipisahkan.
 * 2. Flood fill dari tepi gambar (luar) dan dari pusat (lubang foto) melewati
 *    piksel kotak-kotak → transparan; tepi dihaluskan 3×3.
 * 3. Kotak lubang foto diukur dari hasil flood pusat → lace-frame.ts.
 * 4. Simpan WebP beralfa → src/themes/lili/art/lace-frame.webp.
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/lace-frame.jpg");
const OUT = path.resolve("src/themes/lili/art/lace-frame.webp");
const META = path.resolve("src/themes/lili/art/lace-frame.ts");
/** Lebar keluaran (px) — tampil ±210 px kanvas → tajam di layar 2,5×. */
const OUT_W = 560;

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const isChecker = (i: number) => {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= 5 && r >= 176 && r <= 242;
  };
  const mark = new Uint8Array(W * H);
  const flood = (seeds: number[], tag: number) => {
    const stack = seeds.filter((s) => isChecker(s) && !mark[s]);
    for (const s of stack) mark[s] = tag;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % W;
      const y = (i / W) | 0;
      const nb = [
        x > 0 ? i - 1 : -1,
        x < W - 1 ? i + 1 : -1,
        y > 0 ? i - W : -1,
        y < H - 1 ? i + W : -1,
      ];
      for (const j of nb)
        if (j >= 0 && !mark[j] && isChecker(j)) {
          mark[j] = tag;
          stack.push(j);
        }
    }
  };
  const edge: number[] = [];
  for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) edge.push(y * W, y * W + W - 1);
  flood(edge, 1);
  // pusat lubang: cari piksel kotak-kotak terdekat ke pusat gambar
  const c = ((H / 2) | 0) * W + ((W / 2) | 0);
  let seed = c;
  for (let d = 0; d < 60 && !isChecker(seed); d++) seed = c + d;
  flood([seed], 2);

  // kotak lubang
  let hx0 = W;
  let hy0 = H;
  let hx1 = 0;
  let hy1 = 0;
  for (let i = 0; i < W * H; i++)
    if (mark[i] === 2) {
      const x = i % W;
      const y = (i / W) | 0;
      if (x < hx0) hx0 = x;
      if (x > hx1) hx1 = x;
      if (y < hy0) hy0 = y;
      if (y > hy1) hy1 = y;
    }

  // alfa halus + kotak isi
  const rgba = Buffer.alloc(W * H * 4);
  const rowN = new Uint32Array(H);
  const colN = new Uint32Array(W);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          s += mark[yy * W + xx] ? 0 : 255;
          n++;
        }
      const a = mark[i] ? 0 : Math.round(s / n);
      rgba[i * 4] = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = a;
      if (a > 128) {
        rowN[y]++;
        colN[x]++;
      }
    }
  let y0 = 0;
  while (rowN[y0] < 10) y0++;
  let y1 = H - 1;
  while (rowN[y1] < 10) y1--;
  let x0 = 0;
  while (colN[x0] < 10) x0++;
  let x1 = W - 1;
  while (colN[x1] < 10) x1--;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .resize({ width: OUT_W })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(OUT);
  const r4 = (v: number) => Math.round(v * 10000) / 10000;
  const hole = {
    x: r4((hx0 - x0) / cw),
    y: r4((hy0 - y0) / ch),
    w: r4((hx1 - hx0 + 1) / cw),
    h: r4((hy1 - hy0 + 1) / ch),
  };
  fs.writeFileSync(
    META,
    `// FILE DIBUAT OTOMATIS oleh scripts/lili-lace-frame.ts — jangan diedit manual.\n` +
      `/** Rasio tinggi/lebar bingkai & kotak lubang foto (pecahan lebar/tinggi). */\n` +
      `export const LACE_FRAME = { ratio: ${r4(ch / cw)}, hole: ${JSON.stringify(hole)} } as const;\n`,
  );
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(
    `✓ ${path.relative(process.cwd(), OUT)} · ${kb} KB · isi ${cw}×${ch} · lubang ${JSON.stringify(hole)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
