/**
 * Buat foto placeholder: pernikahan dari foto milik pemilik (lokal,
 * undangan-jorgi-estetik — dengan izin), ulang tahun dari Unsplash (Unsplash
 * License: boleh komersial, atribusi tetap dicatat); ubah ke WebP, lalu tulis
 * public/placeholders/CREDITS.md dari daftar yang sama agar kredit selalu sinkron.
 *
 * Jalankan: pnpm placeholders  [--only=wedding-groom]
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

interface PhotoSource {
  /** Nama file output (tanpa ekstensi). */
  file: string;
  /** Id gambar di images.unsplash.com/photo-{id} (sumber Unsplash). */
  id?: string;
  page?: string;
  photographer?: string;
  /** Berkas lokal relatif ke JORGI_PHOTOS (foto milik pemilik). */
  local?: string;
  /** Potong bagian tertentu (fraksi 0–1) sebelum resize, mis. memisahkan satu orang dari foto berdua. */
  crop?: { left: number; top: number; width: number; height: number };
  usage: string;
}

const PHOTOS: PhotoSource[] = [
  // --- Wedding: foto pernikahan MILIK PEMILIK (undangan-jorgi-estetik) --------
  // Izin: pemilik, pasangan & fotografer setuju dipakai sebagai contoh publik
  // (dikonfirmasi 2026-11-27). Slot lanskap dipotong kepala–lutut dari foto potret.
  {
    file: "wedding-cover",
    local: "gallery/web/0K0A0785-Edit.webp",
    usage: "Foto cover pasangan",
  },
  {
    file: "wedding-bride",
    local: "catin-wanita-oval.webp",
    usage: "Potret mempelai wanita",
  },
  {
    file: "wedding-groom",
    local: "catin-pria-oval.webp",
    usage: "Potret mempelai pria",
  },
  {
    file: "wedding-g1",
    local: "gallery/web/0K0A0739-Edit.webp",
    usage: "Galeri",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-g2",
    local: "gallery/web/0K0A0741-Edit.webp",
    usage: "Galeri",
  },
  {
    file: "wedding-g3",
    local: "gallery/web/0K0A0763-Edit.webp",
    usage: "Galeri",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-g4",
    local: "gallery/web/0K0A0757-Edit.webp",
    usage: "Galeri",
  },
  {
    file: "wedding-g5",
    local: "gallery/web/0K0A0771-Edit.webp",
    usage: "Galeri",
  },
  {
    file: "wedding-g6",
    local: "gallery/web/0K0A0776-Edit.webp",
    usage: "Galeri",
  },
  {
    file: "wedding-g7",
    local: "gallery/web/0K0A0777-Edit.webp",
    usage: "Galeri",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-g8",
    local: "gallery/web/0K0A0790-Edit.webp",
    usage: "Galeri",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-strip1",
    local: "gallery/web/0K0A0758-Edit.webp",
    usage: "Photo strip",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-strip2",
    local: "gallery/web/0K0A0775-Edit.webp",
    usage: "Photo strip",
    crop: { left: 0, top: 0.28, width: 1, height: 0.444 },
  },
  {
    file: "wedding-strip3",
    local: "gallery/web/0K0A0779-Edit.webp",
    usage: "Photo strip",
  },
  {
    file: "wedding-closing",
    local: "gallery/web/0K0A0797-Edit.webp",
    usage: "Foto penutup / polaroid",
  },
  // --- Birthday (Unsplash) ------------------------------------------------------
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
    file: "tirai-beludru.m4a",
    title: "Wedding Music",
    artist: "ikoliks",
    page: "https://pixabay.com/music/wedding-wedding-music-329295/",
    theme: "Tirai Beludru",
  },
  {
    file: "renda-rimba.m4a",
    title: "Romantic Wedding Acoustic Guitar",
    artist: "Tunetank",
    page: "https://pixabay.com/music/small-emotions-romantic-wedding-acoustic-guitar-347266/",
    theme: "Renda Rimba",
  },
  {
    file: "confetti-party.m4a",
    title: "Kids School - Happy Birthday Music",
    artist: "SigmaMusicArt",
    page: "https://pixabay.com/music/happy-childrens-tunes-kids-school-happy-birthday-music-246840/",
    theme: "Pita Krayon",
  },
];

const OUT = path.join(process.cwd(), "public/placeholders");
/** Foto pernikahan milik pemilik (proyek undangan-jorgi-estetik). */
const JORGI_PHOTOS =
  process.env.JORGI_PHOTOS ?? path.join(process.cwd(), "../undangan-jorgi-estetik/public/images");
const MAX_SIDE = 1200;

async function processPhoto(p: PhotoSource): Promise<void> {
  const target = path.join(OUT, "photos", `${p.file}.webp`);
  let input: Buffer;
  if (p.local) {
    input = await fs.readFile(path.join(JORGI_PHOTOS, p.local));
  } else {
    const res = await fetch(`https://images.unsplash.com/photo-${p.id}?w=1600&q=85&fm=jpg`);
    if (!res.ok) throw new Error(`Gagal unduh ${p.file}: HTTP ${res.status}`);
    input = Buffer.from(await res.arrayBuffer());
  }

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
  const own = PHOTOS.filter((p) => p.local);
  const ownRows = own
    .map((p) => `| \`photos/${p.file}.webp\` | ${p.usage} | \`${p.local}\` |`)
    .join("\n");
  const photoRows = PHOTOS.filter((p) => !p.local)
    .map(
      (p) =>
        `| \`photos/${p.file}.webp\` | ${p.usage} | ${p.photographer} | [Unsplash](${p.page}) |`,
    )
    .join("\n");
  const musicRows = MUSIC.map(
    (m) =>
      `| \`music/${m.file}\` | ${m.theme} | "${m.title}" — ${m.artist} | [Pixabay](${m.page}) |`,
  ).join("\n");
  return `# Kredit Aset Placeholder

File ini DIBUAT OTOMATIS oleh \`scripts/gen-placeholders.ts\` — ubah daftarnya di sana.

## Foto pernikahan — milik pemilik

Foto pernikahan pribadi pemilik (proyek undangan-jorgi-estetik). Pemilik, pasangan,
dan fotografer telah mengizinkan dipakai sebagai foto contoh publik di website ini
(dikonfirmasi 2026-11-27). Jangan dipakai di luar website ini.

| File | Dipakai untuk | Sumber (undangan-jorgi-estetik/public/images) |
|---|---|---|
${ownRows}

## Foto ulang tahun (Unsplash License — boleh dipakai komersial, atribusi tidak wajib)

Lisensi: https://unsplash.com/license

| File | Dipakai untuk | Fotografer | Sumber |
|---|---|---|---|
${photoRows}

## Musik (Pixabay Content License)

Lisensi: https://pixabay.com/service/license-summary/

Pixabay memakai bot-check sehingga file tidak bisa diunduh otomatis.
**Unduh manual** dari link di bawah, lalu simpan di \`public/placeholders/music/\`
dengan nama \`<tema>.mp3\`, lalu jalankan \`pnpm music:optimize\` (AAC 96 kbps → \`<tema>.m4a\`,
nama di kolom pertama). Selama file belum ada, player menampilkan "Musik belum tersedia".

| File | Tema | Judul — Artis | Sumber |
|---|---|---|---|
${musicRows}
`;
}

async function main() {
  await fs.mkdir(path.join(OUT, "photos"), { recursive: true });
  await fs.mkdir(path.join(OUT, "music"), { recursive: true });
  // --only=wedding-groom,wedding-bride → hanya unduh ulang foto tertentu
  const only = process.argv
    .find((a) => a.startsWith("--only="))
    ?.split("=")[1]
    ?.split(",");
  for (const p of PHOTOS) if (!only || only.includes(p.file)) await processPhoto(p);
  await fs.writeFile(path.join(OUT, "CREDITS.md"), credits());
  console.log("✓ CREDITS.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
