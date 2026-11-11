/**
 * Unduh foto placeholder dari Unsplash (Unsplash License: boleh komersial,
 * atribusi tidak wajib tapi kita tetap mencatatnya), ubah ke WebP, lalu tulis
 * public/placeholders/CREDITS.md dari daftar yang sama agar kredit selalu sinkron.
 *
 * Jalankan: pnpm placeholders
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

interface PhotoSource {
  /** Nama file output (tanpa ekstensi). */
  file: string;
  /** Id gambar di images.unsplash.com/photo-{id} */
  id: string;
  page: string;
  photographer: string;
  /** Potong bagian tertentu (fraksi 0–1) sebelum resize, mis. memisahkan satu orang dari foto berdua. */
  crop?: { left: number; top: number; width: number; height: number };
  usage: string;
}

const PHOTOS: PhotoSource[] = [
  // --- Wedding -----------------------------------------------------------------
  {
    file: "wedding-cover",
    id: "1650377509454-1bbd8392e122",
    page: "https://unsplash.com/photos/Lr834aonJ70",
    photographer: "Galuh hari setiawan",
    usage: "Foto cover pasangan",
  },
  {
    file: "wedding-bride",
    id: "1650377509428-11e7fe8614a9",
    page: "https://unsplash.com/photos/qVtjqnWYka8",
    photographer: "Galuh hari setiawan",
    usage: "Potret mempelai wanita",
  },
  {
    file: "wedding-groom",
    id: "1771257717271-a0b50e3d9885",
    page: "https://unsplash.com/photos/nXmt5zQ7l0c",
    photographer: "Davin Naziel",
    crop: { left: 0.42, top: 0.12, width: 0.58, height: 0.8 },
    usage: "Potret mempelai pria (dipotong dari foto berdua)",
  },
  {
    file: "wedding-g1",
    id: "1541700513212-79f419c0221d",
    page: "https://unsplash.com/photos/bqFZznf6eVc",
    photographer: "Fahmi Ramadhan",
    usage: "Galeri",
  },
  {
    file: "wedding-g2",
    id: "1650472185090-a8cfdd9a38d3",
    page: "https://unsplash.com/photos/1cyUquII5Zg",
    photographer: "Galuh hari setiawan",
    usage: "Galeri",
  },
  {
    file: "wedding-g3",
    id: "1673073180049-9ef7846f28dd",
    page: "https://unsplash.com/photos/JYPPOBUG2M0",
    photographer: "Ahmad Syarif Maulana",
    usage: "Galeri",
  },
  {
    file: "wedding-g4",
    id: "1678782086537-0cefd87257b6",
    page: "https://unsplash.com/photos/RHfYB_USSEc",
    photographer: "Salman Mukti",
    usage: "Galeri",
  },
  {
    file: "wedding-g5",
    id: "1764641697973-1e55796073bf",
    page: "https://unsplash.com/photos/IiGkUvXXbig",
    photographer: "Ainur Iman",
    usage: "Galeri",
  },
  {
    file: "wedding-g6",
    id: "1667353931393-7cf46f3d0649",
    page: "https://unsplash.com/photos/iVFDSZqXDAc",
    photographer: "Fery Abdurrahman",
    usage: "Galeri",
  },
  {
    file: "wedding-g7",
    id: "1673073220743-ee78b02eb029",
    page: "https://unsplash.com/photos/0QL68R5wGRU",
    photographer: "Ahmad Syarif Maulana",
    usage: "Galeri",
  },
  {
    file: "wedding-g8",
    id: "1520854221256-17451cc331bf",
    page: "https://unsplash.com/photos/464ps_nOflw",
    photographer: "Jeremy Wong Weddings",
    usage: "Galeri",
  },
  {
    file: "wedding-strip1",
    id: "1591604466107-ec97de577aff",
    page: "https://unsplash.com/photos/1Bs2sZ9fD2Q",
    photographer: "Eugenia Pan'kiv",
    usage: "Photo strip",
  },
  {
    file: "wedding-strip2",
    id: "1621621667797-e06afc217fb0",
    page: "https://unsplash.com/photos/aC5_EFhq7Fs",
    photographer: "Jonathan Borba",
    usage: "Photo strip",
  },
  {
    file: "wedding-strip3",
    id: "1606216794079-73f85bbd57d5",
    page: "https://unsplash.com/photos/mLIurLmSRAY",
    photographer: "Jakob Owens",
    usage: "Photo strip",
  },
  {
    file: "wedding-closing",
    id: "1606216794074-735e91aa2c92",
    page: "https://unsplash.com/photos/SiniLJkXhMc",
    photographer: "Jakob Owens",
    usage: "Foto penutup / polaroid",
  },
  // --- Ulang tahun -------------------------------------------------------------
  {
    file: "birthday-celebrant",
    id: "1660234396406-9ff37a83e7b3",
    page: "https://unsplash.com/photos/0KdRK5C-xbs",
    photographer: "Keisha Kim",
    usage: "Foto yang berulang tahun",
  },
  {
    file: "birthday-g1",
    id: "1660234395664-0ed2948c6fb3",
    page: "https://unsplash.com/photos/MH_tFKLWJXM",
    photographer: "Keisha Kim",
    usage: "Galeri",
  },
  {
    file: "birthday-g2",
    id: "1608790672275-309c02d888ff",
    page: "https://unsplash.com/photos/As8zq82LBpw",
    photographer: "Nathan Dumlao",
    usage: "Galeri",
  },
  {
    file: "birthday-g3",
    id: "1516668557604-c8e814fdb184",
    page: "https://unsplash.com/photos/cK6ixOQx1fI",
    photographer: "Jorge Ibanez",
    usage: "Galeri",
  },
  {
    file: "birthday-g4",
    id: "1603862018057-8a1ae272751a",
    page: "https://unsplash.com/photos/iSiP73IHgng",
    photographer: "behrouz sasani",
    usage: "Galeri",
  },
  {
    file: "birthday-g5",
    id: "1774290687181-665ef6740672",
    page: "https://unsplash.com/photos/KzrfaMQSsP4",
    photographer: "Alexander Mass",
    usage: "Galeri",
  },
];

/** Musik Pixabay: TIDAK bisa diunduh otomatis (halaman memakai bot-check), unduh manual. */
const MUSIC = [
  {
    file: "tirai-beludru.mp3",
    title: "Wedding Music",
    artist: "ikoliks",
    page: "https://pixabay.com/music/wedding-wedding-music-329295/",
    theme: "Tirai Beludru",
  },
  {
    file: "renda-rimba.mp3",
    title: "Romantic Wedding Acoustic Guitar",
    artist: "Tunetank",
    page: "https://pixabay.com/music/small-emotions-romantic-wedding-acoustic-guitar-347266/",
    theme: "Renda Rimba",
  },
  {
    file: "confetti-party.mp3",
    title: "Kids School - Happy Birthday Music",
    artist: "SigmaMusicArt",
    page: "https://pixabay.com/music/happy-childrens-tunes-kids-school-happy-birthday-music-246840/",
    theme: "Confetti Party",
  },
];

const OUT = path.join(process.cwd(), "public/placeholders");
const MAX_SIDE = 1200;

async function processPhoto(p: PhotoSource): Promise<void> {
  const target = path.join(OUT, "photos", `${p.file}.webp`);
  const res = await fetch(`https://images.unsplash.com/photo-${p.id}?w=1600&q=85&fm=jpg`);
  if (!res.ok) throw new Error(`Gagal unduh ${p.file}: HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  let img = sharp(input).rotate();
  if (p.crop) {
    const meta = await sharp(input).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    img = img.extract({
      left: Math.round(w * p.crop.left),
      top: Math.round(h * p.crop.top),
      width: Math.round(w * p.crop.width),
      height: Math.round(h * p.crop.height),
    });
  }
  await img
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(target);
  console.log(`✓ ${p.file}.webp`);
}

function credits(): string {
  const photoRows = PHOTOS.map(
    (p) => `| \`photos/${p.file}.webp\` | ${p.usage} | ${p.photographer} | [Unsplash](${p.page}) |`,
  ).join("\n");
  const musicRows = MUSIC.map(
    (m) =>
      `| \`music/${m.file}\` | ${m.theme} | "${m.title}" — ${m.artist} | [Pixabay](${m.page}) |`,
  ).join("\n");
  return `# Kredit Aset Placeholder

File ini DIBUAT OTOMATIS oleh \`scripts/gen-placeholders.ts\` — ubah daftarnya di sana.

## Foto (Unsplash License — boleh dipakai komersial, atribusi tidak wajib)

Lisensi: https://unsplash.com/license

| File | Dipakai untuk | Fotografer | Sumber |
|---|---|---|---|
${photoRows}

## Musik (Pixabay Content License)

Lisensi: https://pixabay.com/service/license-summary/

Pixabay memakai bot-check sehingga file tidak bisa diunduh otomatis.
**Unduh manual** dari link di bawah, lalu simpan di \`public/placeholders/music/\`
dengan nama file persis seperti kolom pertama. Selama file belum ada, player
musik menampilkan status "Musik belum tersedia" tanpa error.

| File | Tema | Judul — Artis | Sumber |
|---|---|---|---|
${musicRows}
`;
}

async function main() {
  await fs.mkdir(path.join(OUT, "photos"), { recursive: true });
  await fs.mkdir(path.join(OUT, "music"), { recursive: true });
  for (const p of PHOTOS) await processPhoto(p);
  await fs.writeFile(path.join(OUT, "CREDITS.md"), credits());
  console.log("✓ CREDITS.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
