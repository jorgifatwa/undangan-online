/**
 * Komposisi bingkai hero/penutup tema Lili dari gambar milik pemilik
 * (bingkai hijau + alas oval pink + lili + mutiara + kupu-kupu di atas kertas):
 *
 *   pnpm tsx scripts/lili-hero-frame.ts [.reference/lili/frame-composite.jpg]
 *
 * 1. Latar kertas → transparan: flood fill dari tepi gambar melewati piksel
 *    "kertas" (krem keabu, lebih gelap dari tepi stiker putih).
 * 2. Lubang foto: ukur area pink tengah (flood fill dari pusat), lalu potong
 *    elips bersih seukuran area itu; alas pucat di sekelilingnya tetap.
 * 3. Tepi alfa dihaluskan (rata-rata 3×3), potong ke kotak isi.
 * 4. Tulis src/themes/lili/art/hero-frame.webp + hero-frame.ts (rasio &
 *    elips lubang dalam pecahan lebar/tinggi gambar).
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/frame-composite.jpg");
const OUT = path.resolve("src/themes/lili/art/hero-frame.webp");
const META = path.resolve("src/themes/lili/art/hero-frame.ts");
const OUT_W = 760;

async function main() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const rgb = (i: number) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];

  const isPaper = (i: number) => {
    const [r, g, b] = rgb(i);
    return r >= 214 && r <= 249 && Math.abs(r - g) <= 7 && r - b >= 3 && r - b <= 20;
  };
  const isPink = (i: number) => {
    const [r, g, b] = rgb(i);
    // pink inti yang rata (alas kotak-kotak di sekelilingnya lebih merah/lebih pucat)
    return r >= 238 && r - g >= 22 && r - g <= 34 && Math.abs(g - b) <= 6;
  };

  const fill = (seeds: number[], ok: (i: number) => boolean) => {
    const mark = new Uint8Array(W * H);
    const stack = seeds.filter(ok);
    for (const s of stack) mark[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % W;
      const y = (i / W) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!mark[j] && ok(j)) {
          mark[j] = 1;
          stack.push(j);
        }
      }
    }
    return mark;
  };

  // 1. kertas dari semua tepi
  const edge: number[] = [];
  for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) edge.push(y * W, y * W + W - 1);
  const paper = fill(edge, isPaper);
  // bintik serat kertas yang terang: jadikan kertas bila mayoritas tetangga
  // (radius 3) sudah kertas — dua putaran
  for (let pass = 0; pass < 2; pass++) {
    const add: number[] = [];
    for (let y = 3; y < H - 3; y++)
      for (let x = 3; x < W - 3; x++) {
        const i = y * W + x;
        if (paper[i]) continue;
        let n = 0;
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) n += paper[i + dy * W + dx];
        if (n >= 30) add.push(i);
      }
    for (const i of add) paper[i] = 1;
  }

  // 2. pink dari pusat area oval (cari benih pink terdekat ke pusat)
  let seed = -1;
  for (let r = 0; r < 200 && seed < 0; r += 4)
    for (const [dx, dy] of [
      [0, 0],
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
    ]) {
      const i = (((H * 0.52) | 0) + dy) * W + ((W * 0.5) | 0) + dx;
      if (isPink(i)) {
        seed = i;
        break;
      }
    }
  if (seed < 0) throw new Error("Area pink di tengah tidak ditemukan.");
  const pink = fill([seed], isPink);

  // lubang: kotak area pink
  let hx0 = W;
  let hy0 = H;
  let hx1 = 0;
  let hy1 = 0;
  for (let i = 0; i < W * H; i++)
    if (pink[i]) {
      const x = i % W;
      const y = (i / W) | 0;
      if (x < hx0) hx0 = x;
      if (x > hx1) hx1 = x;
      if (y < hy0) hy0 = y;
      if (y > hy1) hy1 = y;
    }

  // lubang = seluruh bagian dalam bingkai hijau (alas pink & tepi putih ikut
  // dibuang, foto langsung menempel ke manik bingkai). Tepi dalam diukur dengan
  // sinar dari pusat ke kiri, kanan & bawah (kanan atas tertutup bunga).
  const ecx = (hx0 + hx1) / 2;
  const ecy = (hy0 + hy1) / 2;
  const green = (x: number, y: number) => {
    const [r, g, b] = rgb((y | 0) * W + (x | 0));
    return g > r + 4 && g > b + 18;
  };
  const ray = (dx: number, dy: number) => {
    let d = 20;
    while (!green(ecx + dx * d, ecy + dy * d)) d++;
    return d;
  };
  const erx = (ray(-1, 0) + ray(1, 0)) / 2 + 3;
  const ery = ray(0, 1) + 3;
  /** Piksel alas (pink pucat / putih) — bunga & mutiara yang menumpang tetap. */
  const isMat = (i: number) => {
    const [r, g, b] = rgb(i);
    return Math.min(r, g, b) >= 178 && r - g <= 46 && Math.abs(g - b) <= 16;
  };
  const inHole = (i: number) => {
    const x = i % W;
    const y = (i / W) | 0;
    const e = ((x - ecx) / erx) ** 2 + ((y - ecy) / ery) ** 2;
    // inti elips selalu dibuang; dekat tepi hanya piksel alas
    if (e > 1) return false;
    // kelopak lili yang menjorok ke dalam lubang (pink pekat / garis) tetap
    const [r, g] = rgb(i);
    if (r - g >= 48 || g < 172) return false;
    return e <= 0.86 || isMat(i);
  };
  hx0 = ecx - erx;
  hx1 = ecx + erx;
  hy0 = ecy - ery;
  hy1 = ecy + ery;

  // 3. alfa + penghalusan 3×3, kotak isi
  const hard = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) hard[i] = paper[i] || inHole(i) ? 0 : 255;
  const rgba = Buffer.alloc(W * H * 4);
  const rowN = new Uint32Array(H);
  const colN = new Uint32Array(W);
  let x0 = 0;
  let y0 = 0;
  let x1 = W - 1;
  let y1 = H - 1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          s += hard[yy * W + xx];
          n++;
        }
      const i = y * W + x;
      const a = hard[i] ? Math.round(s / n) : Math.round((s / n) * 0.5);
      const [r, g, b] = rgb(i);
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      rgba[i * 4 + 3] = a;
      if (a > 128) {
        rowN[y]++;
        colN[x]++;
      }
    }
  // kotak isi dari baris/kolom yang benar-benar berisi (abaikan bintik sisa)
  while (rowN[y0] < 8 && y0 < H - 1) y0++;
  y1 = H - 1;
  while (rowN[y1] < 8 && y1 > 0) y1--;
  x0 = 0;
  while (colN[x0] < 8 && x0 < W - 1) x0++;
  x1 = W - 1;
  while (colN[x1] < 8 && x1 > 0) x1--;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  // 4. simpan
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .resize({ width: OUT_W })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(OUT);
  const r4 = (v: number) => Math.round(v * 10000) / 10000;
  const hole = {
    cx: r4(((hx0 + hx1) / 2 - x0) / cw),
    cy: r4(((hy0 + hy1) / 2 - y0) / ch),
    rx: r4((hx1 - hx0) / 2 / cw),
    ry: r4((hy1 - hy0) / 2 / ch),
  };
  fs.writeFileSync(
    META,
    `// FILE DIBUAT OTOMATIS oleh scripts/lili-hero-frame.ts — jangan diedit manual.\n` +
      `/** Rasio tinggi/lebar komposisi & elips lubang foto (pecahan lebar/tinggi). */\n` +
      `export const HERO_FRAME = { ratio: ${r4(ch / cw)}, hole: ${JSON.stringify(hole)} } as const;\n`,
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
