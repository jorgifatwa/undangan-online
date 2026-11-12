/**
 * Bangun SEMUA file font (tema + website) yang sudah di-subset (woff2) dari
 * sumber OFL resmi (github.com/google/fonts) → src/themes/_fonts/.
 * Tidak ada lagi next/font/google: build tidak bergantung pada jaringan ke
 * Google Fonts (Turbopack sempat gagal mengunduhnya secara acak).
 *
 *   pnpm fonts:build
 *
 * Kenapa tidak next/font/google saja? Subset "latin" Google masih memuat
 * ratusan glyph + seluruh rentang sumbu variabel. Di sini tiap font dipotong
 * sesuai pemakaian:
 *  - teks dinamis (nama, alamat, ucapan)  → Latin dasar + Latin-1 + tanda baca umum
 *  - judul statis (mis. "Our Gallery")    → hanya huruf yang dipakai
 *  - font variabel                        → hanya rentang/berat yang dipakai
 *  - Amiri                                 → blok Arab saja (+ ligatur & tanda Quran
 *                                            tetap ikut lewat penutupan GSUB)
 * File dipakai bersama antar tema (Cormorant, Amiri) sehingga ter-cache sekali.
 * Teks lisensi OFL tiap keluarga disalin ke src/themes/_fonts/licenses/.
 *
 * Jika menambah teks statis baru pada font ber-`text`, tambahkan hurufnya di
 * sini lalu jalankan ulang (glyph yang hilang akan tampil dengan font cadangan).
 */
import fs from "node:fs/promises";
import path from "node:path";

import subsetFont from "subset-font";

const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache/fonts-src");
const OUT = path.join(ROOT, "src/themes/_fonts");
/** Font gambar pratinjau link (OG) — dibaca server saat membuat PNG. */
const OG_OUT = path.join(ROOT, "src/lib/og/fonts");
const GH = "https://raw.githubusercontent.com/google/fonts/main";

/** Latin untuk teks dinamis: ASCII, Latin-1, dan tanda baca tipografis. */
const LATIN = [
  ...range(0x20, 0x7e),
  ...range(0xa0, 0xff),
  0x2013,
  0x2014,
  0x2018,
  0x2019,
  0x201a,
  0x201c,
  0x201d,
  0x2022,
  0x2026,
  0x20ac,
];
/** Blok Arab utama + pengendali arah/penyambung + lingkaran titik + ligatur Allah/ﷺ.
 * (Blok Arab Suplemen/Extended untuk bahasa lain tidak disertakan.) */
const ARABIC = [
  0x20,
  0xa0,
  ...range(0x0600, 0x06ff), // termasuk seluruh tanda baca Quran (06D6–06ED)
  ...range(0x200c, 0x200f),
  0x25cc,
  ...range(0xfdf0, 0xfdfd),
];
const BULAN =
  "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember";

interface Out {
  file: string;
  /** Titik kode atau teks yang glyph-nya disimpan. */
  chars: number[] | string;
  /** Instancing sumbu variabel: angka = dipaku, {min,max} = dipersempit. */
  axes?: Record<string, number | { min: number; max: number }>;
  /** "og" = TTF statis untuk gambar pratinjau link (satori tidak bisa membaca woff2). */
  og?: boolean;
}
interface Family {
  name: string;
  /** Fitur OpenType yang disimpan (default LATIN_FEATURES / ARABIC_FEATURES). */
  features?: string[];
  /** Path di repo google/fonts. */
  src: string;
  license: string;
  outputs: Out[];
}

const FAMILIES: Family[] = [
  // ---- Renda Rimba ----
  {
    name: "Jost",
    src: "ofl/jost/Jost[wght].ttf",
    license: "ofl/jost/OFL.txt",
    outputs: [{ file: "jost-300-500.woff2", chars: LATIN, axes: { wght: { min: 300, max: 500 } } }],
  },
  {
    name: "Caveat Brush",
    src: "ofl/caveatbrush/CaveatBrush-Regular.ttf",
    // ligatur tulisan tangan Caveat Brush ±23 KB dan nyaris tak terlihat di nama panggilan
    features: ["kern", "ccmp", "locl", "mark", "mkmk"],
    license: "ofl/caveatbrush/OFL.txt",
    outputs: [{ file: "caveat-brush.woff2", chars: LATIN }],
  },
  {
    name: "Caveat",
    src: "ofl/caveat/Caveat[wght].ttf",
    license: "ofl/caveat/OFL.txt",
    // hanya tanggal cover (dd/mm/yyyy)
    outputs: [{ file: "caveat-date.woff2", chars: "0123456789/.- ", axes: { wght: 400 } }],
  },
  {
    name: "Great Vibes",
    src: "ofl/greatvibes/GreatVibes-Regular.ttf",
    license: "ofl/greatvibes/OFL.txt",
    outputs: [
      { file: "great-vibes.woff2", chars: LATIN },
      { file: "great-vibes.ttf", chars: LATIN, og: true },
    ],
  },
  {
    name: "Parisienne",
    src: "ofl/parisienne/Parisienne-Regular.ttf",
    license: "ofl/parisienne/OFL.txt",
    outputs: [{ file: "parisienne-titles.woff2", chars: "Our Gallery Wedding Gift" }],
  },
  {
    name: "Kaushan Script",
    src: "ofl/kaushanscript/KaushanScript-Regular.ttf",
    license: "ofl/kaushanscript/OFL.txt",
    outputs: [
      { file: "kaushan-titles.woff2", chars: `${BULAN} Kami Akan Menikah! Live Streaming` },
    ],
  },
  {
    name: "Lora",
    src: "ofl/lora/Lora[wght].ttf",
    license: "ofl/lora/OFL.txt",
    outputs: [
      { file: "lora-400-600.woff2", chars: LATIN, axes: { wght: { min: 400, max: 600 } } },
      { file: "lora-500.ttf", chars: LATIN, axes: { wght: 500 }, og: true },
    ],
  },
  {
    name: "Lora Italic",
    src: "ofl/lora/Lora-Italic[wght].ttf",
    license: "ofl/lora/OFL.txt",
    outputs: [{ file: "lora-italic-400.woff2", chars: LATIN, axes: { wght: 400 } }],
  },
  // ---- Bersama (Renda Rimba + Tirai Beludru) ----
  {
    name: "Cormorant Garamond",
    src: "ofl/cormorantgaramond/CormorantGaramond[wght].ttf",
    license: "ofl/cormorantgaramond/OFL.txt",
    outputs: [
      { file: "cormorant-400-700.woff2", chars: LATIN, axes: { wght: { min: 400, max: 700 } } },
      { file: "cormorant-600.ttf", chars: LATIN, axes: { wght: 600 }, og: true },
    ],
  },
  {
    name: "Cormorant Garamond Italic",
    src: "ofl/cormorantgaramond/CormorantGaramond-Italic[wght].ttf",
    license: "ofl/cormorantgaramond/OFL.txt",
    // hanya kata miring di judul ("SAVE THE DATE!", "DRESS CODE")
    outputs: [{ file: "cormorant-italic-titles.woff2", chars: "THE CODE", axes: { wght: 500 } }],
  },
  {
    name: "Amiri",
    src: "ofl/amiri/Amiri-Regular.ttf",
    license: "ofl/amiri/OFL.txt",
    outputs: [{ file: "amiri-arabic.woff2", chars: ARABIC }],
  },
  // ---- Tirai Beludru ----
  {
    name: "Pinyon Script",
    src: "ofl/pinyonscript/PinyonScript-Regular.ttf",
    license: "ofl/pinyonscript/OFL.txt",
    outputs: [
      { file: "pinyon-script.woff2", chars: LATIN },
      { file: "pinyon-script.ttf", chars: LATIN, og: true },
    ],
  },
  {
    name: "Italianno",
    src: "ofl/italianno/Italianno-Regular.ttf",
    license: "ofl/italianno/OFL.txt",
    outputs: [{ file: "italianno.woff2", chars: LATIN }],
  },
  {
    name: "Noto Serif",
    src: "ofl/notoserif/NotoSerif[wdth,wght].ttf",
    license: "ofl/notoserif/OFL.txt",
    outputs: [{ file: "noto-serif-400.woff2", chars: LATIN, axes: { wdth: 100, wght: 400 } }],
  },
  {
    name: "Quattrocento",
    src: "ofl/quattrocento/Quattrocento-Regular.ttf",
    license: "ofl/quattrocento/OFL.txt",
    outputs: [{ file: "quattrocento-400.woff2", chars: LATIN }],
  },
  {
    name: "Quattrocento Bold",
    src: "ofl/quattrocento/Quattrocento-Bold.ttf",
    license: "ofl/quattrocento/OFL.txt",
    outputs: [{ file: "quattrocento-700.woff2", chars: LATIN }],
  }, // ---- Confetti Party ----
  {
    name: "Fredoka",
    src: "ofl/fredoka/Fredoka[wdth,wght].ttf",
    license: "ofl/fredoka/OFL.txt",
    outputs: [
      {
        file: "fredoka-500-700.woff2",
        chars: LATIN,
        axes: { wdth: 100, wght: { min: 500, max: 700 } },
      },
      { file: "fredoka-600.ttf", chars: LATIN, axes: { wdth: 100, wght: 600 }, og: true },
    ],
  },
  {
    name: "Nunito",
    src: "ofl/nunito/Nunito[wght].ttf",
    license: "ofl/nunito/OFL.txt",
    outputs: [
      { file: "nunito-400-700.woff2", chars: LATIN, axes: { wght: { min: 400, max: 700 } } },
      { file: "nunito-700.ttf", chars: LATIN, axes: { wght: 700 }, og: true },
    ],
  },
  // ---- Website (landing, dashboard, galeri tema) — bukan font undangan ----
  {
    name: "Plus Jakarta Sans",
    src: "ofl/plusjakartasans/PlusJakartaSans[wght].ttf",
    license: "ofl/plusjakartasans/OFL.txt",
    outputs: [
      { file: "site-jakarta-300-700.woff2", chars: LATIN, axes: { wght: { min: 300, max: 700 } } },
      { file: "jakarta-600.ttf", chars: LATIN, axes: { wght: 600 }, og: true },
    ],
  },
  {
    name: "Fraunces",
    src: "ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
    license: "ofl/fraunces/OFL.txt",
    // SOFT & WONK tidak dipakai → dipaku; opsz tetap variabel (judul besar lebih rapi)
    outputs: [
      {
        file: "site-fraunces-400-600.woff2",
        chars: LATIN,
        axes: { SOFT: 0, WONK: 0, wght: { min: 400, max: 600 } },
      },
    ],
  },
];

/** Fitur OpenType yang disimpan (default subset-font = SEMUA, termasuk swash/alternatif
 * yang tidak pernah dipakai browser tanpa CSS font-feature-settings). */
const LATIN_FEATURES = ["kern", "liga", "clig", "calt", "ccmp", "locl", "mark", "mkmk", "rlig"];
const ARABIC_FEATURES = [...LATIN_FEATURES, "isol", "init", "medi", "fina", "curs", "rclt"];

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

async function fetchCached(rel: string): Promise<Buffer> {
  const file = path.join(CACHE, rel.replace(/\//g, "__"));
  try {
    return await fs.readFile(file);
  } catch {
    const res = await fetch(`${GH}/${rel.split("/").map(encodeURIComponent).join("/")}`);
    if (!res.ok) throw new Error(`Gagal mengunduh ${rel}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(CACHE, { recursive: true });
    await fs.writeFile(file, buf);
    return buf;
  }
}

async function main() {
  await fs.mkdir(path.join(OUT, "licenses"), { recursive: true });
  await fs.mkdir(OG_OUT, { recursive: true });
  let total = 0;
  const rows: string[] = [];
  for (const fam of FAMILIES) {
    const src = await fetchCached(fam.src);
    const license = await fetchCached(fam.license);
    await fs.writeFile(path.join(OUT, "licenses", `${fam.license.split("/")[1]}-OFL.txt`), license);
    for (const o of fam.outputs) {
      const text = typeof o.chars === "string" ? o.chars : String.fromCodePoint(...o.chars);
      const out = await subsetFont(src, text, {
        targetFormat: o.og ? "truetype" : "woff2",
        variationAxes: o.axes,
        // hinting TrueType hanya membantu sebagian kecil layar Windows lama;
        // Google Fonts pun menyajikan versi tanpa hinting ke kebanyakan perangkat
        noHinting: true,
        keepFeatures: fam.features ?? (fam.name === "Amiri" ? ARABIC_FEATURES : LATIN_FEATURES),
      });
      await fs.writeFile(path.join(o.og ? OG_OUT : OUT, o.file), out);
      total += out.length;
      rows.push(
        `  ${o.file.padEnd(32)} ${String(Math.round(out.length / 1024)).padStart(4)} KB  (${fam.name}, sumber ${Math.round(src.length / 1024)} KB)`,
      );
    }
  }
  console.log(rows.join("\n"));
  console.log(
    `▶ ${rows.length} file font → src/themes/_fonts/ — total ${Math.round(total / 1024)} KB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
