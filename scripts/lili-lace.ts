/**
 * Pita renda cover tema Lili dari gambar renda milik pemilik — PNG transparan
 * (dipakai langsung) atau foto berlatar hitam (renda mendatar, atau strip tegak
 * yang diputar):
 *
 *   pnpm tsx scripts/lili-lace.ts [.reference/lili/lace-source.png]
 *
 * 1. Cari batas renda. Mendatar: pakai seluruh lebar foto. Tegak: potong
 *    segmen sepanjang LENGTH px.
 * 2. Latar hitam → transparan: alfa dari kecerahan (renda putih di atas hitam),
 *    warna krem bergradasi mengikuti kecerahan.
 * 3. (Strip tegak: putar 90°.) Lalu lengkungkan: tiap kolom diturunkan
 *    SAG·(1 − ((x − c)/c)²) px → tengah pita lebih rendah, seperti desain.
 * 4. Simpan WebP beralfa → src/themes/lili/art/lace-band.webp (di-commit).
 */
import path from "node:path";

import sharp from "sharp";

const SRC = process.argv[2] ?? path.resolve(".reference/lili/lace-horizontal.png");
const OUT = path.resolve("src/themes/lili/art/lace-band.webp");
/** Panjang segmen strip yang dipakai (px sumber) → rasio pita ±3:1 di cover. */
const LENGTH = 1060;
const START = 330;
/** Lengkung (px keluaran) — tengah turun ±25 px kanvas pada lebar 430. */
const SAG = 50;
/** Lebar keluaran (px) — cukup tajam untuk layar 2× di kolom 430. */
const OUT_W = 860;

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** PNG transparan (sudut alfa 0): pakai alfanya langsung, potong ke isi. */
async function transparentFlat() {
  const meta = await sharp(SRC).metadata();
  if (!meta.hasAlpha) return null;
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (data[3] !== 0) return null;
  const W = info.width;
  const H = info.height;
  let x0 = W;
  let x1 = 0;
  let y0 = H;
  let y1 = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (data[(y * W + x) * 4 + 3] > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return sharp(SRC)
    .ensureAlpha()
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ width: Math.min(OUT_W, x1 - x0 + 1) })
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function main() {
  const pre = await transparentFlat();
  const flat = pre ?? (await fromDark());
  const fw = flat.info.width;
  const fh = flat.info.height;
  const label = pre ? "PNG transparan" : "latar hitam";
  return curveAndSave(flat.data, fw, fh, label);
}

async function fromDark() {
  const grey = await sharp(SRC)
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = grey.info;

  // 1. batas strip: renda mendatar (melintang penuh) atau tegak (strip vertikal)
  const col = new Float64Array(W);
  const row = new Float64Array(H);
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x++) {
      const v = grey.data[y * W + x];
      col[x] += v;
      row[y] += v;
    }
  const bounds = (a: Float64Array) => {
    const max = Math.max(...a);
    let lo = 0;
    let hi = a.length - 1;
    while (a[lo] < max * 0.06) lo++;
    while (a[hi] < max * 0.06) hi--;
    return [Math.max(0, lo - 4), Math.min(a.length - 1, hi + 4)];
  };
  const [cl, cr] = bounds(col);
  const [rt, rb] = bounds(row);
  const horizontal = cr - cl > (rb - rt) * 1.5;
  // area yang dipakai (koordinat sumber)
  const [l, r] = horizontal ? [0, W - 1] : [cl, cr];
  const top = horizontal ? rt : Math.min(START, H - LENGTH);
  const sh = horizontal ? rb - rt + 1 : LENGTH;
  const sw = r - l + 1;

  // 2. alfa dari kecerahan, warna krem (#d8d3c6 → #fbf9f3)
  const rgba = Buffer.alloc(sw * sh * 4);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const v = grey.data[(top + y) * W + (l + x)];
      const a = smooth(22, 190, v);
      const t = smooth(40, 235, v);
      const i = (y * sw + x) * 4;
      rgba[i] = Math.round(216 + (251 - 216) * t);
      rgba[i + 1] = Math.round(211 + (249 - 211) * t);
      rgba[i + 2] = Math.round(198 + (243 - 198) * t);
      rgba[i + 3] = Math.round(a * 255);
    }

  // 3. putar mendatar + skala ke lebar keluaran
  const base = sharp(rgba, { raw: { width: sw, height: sh, channels: 4 } });
  const flat = await (horizontal ? base : base.rotate(90))
    .resize({ width: Math.min(OUT_W, horizontal ? sw : sh) })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return flat;
}

async function curveAndSave(data: Buffer, fw: number, fh: number, label: string) {
  const flat = { data };
  // lengkung: geser tiap kolom ke bawah
  const oh = fh + SAG;
  const curved = Buffer.alloc(fw * oh * 4);
  const c = (fw - 1) / 2;
  for (let x = 0; x < fw; x++) {
    const dy = SAG * (1 - ((x - c) / c) ** 2);
    const d0 = Math.floor(dy);
    const f = dy - d0; // interpolasi linear antarbaris agar tepi halus
    for (let y = 0; y < oh; y++) {
      const sy = y - d0;
      const px = (yy: number, k: number) =>
        yy >= 0 && yy < fh ? flat.data[(yy * fw + x) * 4 + k] : 0;
      const o = (y * fw + x) * 4;
      const a0 = px(sy, 3);
      const a1 = px(sy - 1, 3);
      const a = a0 * (1 - f) + a1 * f;
      curved[o + 3] = Math.round(a);
      for (let k = 0; k < 3; k++) {
        const c0 = px(sy, k);
        const c1 = px(sy - 1, k);
        curved[o + k] = a > 0 ? Math.round((c0 * a0 * (1 - f) + c1 * a1 * f) / a) : 0;
      }
    }
  }

  // 4. simpan
  await sharp(curved, { raw: { width: fw, height: oh, channels: 4 } })
    .webp({ quality: 70, alphaQuality: 80, effort: 6, smartSubsample: true })
    .toFile(OUT);
  const meta = await sharp(OUT).metadata();
  const kb = Math.round(((await import("node:fs")).statSync(OUT).size / 1024) * 10) / 10;
  console.log(
    `✓ ${path.relative(process.cwd(), OUT)} ${meta.width}×${meta.height} · ${kb} KB (${label})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
