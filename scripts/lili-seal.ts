/**
 * Segel lilin cover tema Lili dari foto segel milik pemilik (latar polos):
 *
 *   pnpm tsx scripts/lili-seal.ts [.reference/lili/seal-source.png]
 *
 * 1. Warna latar = rata-rata empat sudut foto.
 * 2. Kotak segel = piksel yang cukup berbeda dari latar → pusat & jari-jari
 *    lingkaran (segel bulat; permukaan dalamnya bisa mirip latar, jadi alfa
 *    TIDAK diambil dari selisih warna, melainkan dari lingkaran).
 * 3. Potong persegi di sekitar lingkaran, alfa = lingkaran bertepi halus.
 * 4. Simpan WebP beralfa → src/themes/lili/art/rose-seal.webp (di-commit).
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/seal-source.png");
const OUT = path.resolve("src/themes/lili/art/rose-seal.webp");
/** Sisi keluaran (px) — segel tampil ±154 px kanvas → cukup untuk layar 2,5×. */
const OUT_SIDE = 400;

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x: number, y: number) => {
    const i = (y * W + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // 1. warna latar dari sudut (kotak 12 px)
  const bg = [0, 0, 0];
  let n = 0;
  for (const [cx, cy] of [
    [0, 0],
    [W - 12, 0],
    [0, H - 12],
    [W - 12, H - 12],
  ])
    for (let y = cy; y < cy + 12; y++)
      for (let x = cx; x < cx + 12; x++) {
        const p = px(x, y);
        for (let k = 0; k < 3; k++) bg[k] += p[k];
        n++;
      }
  for (let k = 0; k < 3; k++) bg[k] /= n;

  // 2. kotak piksel yang berbeda dari latar
  let x0 = W;
  let y0 = H;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = px(x, y);
      const d = Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
      if (d > 30) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.min(x1 - x0, y1 - y0) / 2;

  // 3. potong persegi + alfa lingkaran bertepi halus (±1,5 px)
  const side = Math.ceil(R * 2) + 4;
  const left = Math.round(cx - side / 2);
  const top = Math.round(cy - side / 2);
  const out = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const sx = Math.min(W - 1, Math.max(0, left + x));
      const sy = Math.min(H - 1, Math.max(0, top + y));
      const p = px(sx, sy);
      const dist = Math.hypot(left + x - cx, top + y - cy);
      const a = Math.min(1, Math.max(0, (R - dist + 1.5) / 3));
      const o = (y * side + x) * 4;
      out[o] = p[0];
      out[o + 1] = p[1];
      out[o + 2] = p[2];
      out[o + 3] = Math.round(a * 255);
    }

  // 4. simpan
  await sharp(out, { raw: { width: side, height: side, channels: 4 } })
    .resize({ width: OUT_SIDE, height: OUT_SIDE })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(OUT);
  const kb = Math.round((fs.statSync(OUT).size / 1024) * 10) / 10;
  console.log(
    `✓ ${path.relative(process.cwd(), OUT)} ${OUT_SIDE}×${OUT_SIDE} · ${kb} KB (lingkaran pusat ${cx.toFixed(0)},${cy.toFixed(0)} r ${R.toFixed(0)}, latar rgb(${bg.map((v) => v.toFixed(0)).join(",")}))`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
