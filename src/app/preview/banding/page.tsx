import fs from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fontClassName as rendaFonts } from "@/themes/renda-rimba/fonts";
import { fontClassName as tiraiFonts } from "@/themes/tirai-beludru/fonts";

import { Banding, type FontRow, type ThemeShots } from "./Banding";

export const metadata: Metadata = { title: "Banding Referensi", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Screenshot referensi (key dari `pnpm ref:shots`) → section tema yang
 * sepadan. Iframe tema digulir ke section itu (?focus=); `null` = cover.
 */
const SECTION_OF: Record<string, Record<string, string | null>> = {
  "tirai-beludru": {
    cover: null,
    "section-intro": "ayat",
    "section-couple": "profil",
    "section-event": "acara",
    "section-gift": "amplop",
    "section-wishes": "ucapan",
    "section-gallery": "galeri",
    "section-closing": "penutup",
  },
  "renda-rimba": {
    cover: null,
    PBBPnyxcTPl9Z7h7: "ayat",
    s2: "hitungMundur",
    PBDcMBpP2VLcJXr3: "profil",
    PBVWFZGVMC2Hd0pM: "galeri",
    PBMNCKVBbxG1xrkl: "amplop",
    PBSZNtrRL3kdDwvG: "ucapan",
    PBk2RB5fMH0sd4tc: "penutup",
  },
};

/**
 * Padanan font: font asli desain (TIDAK dimuat — file ekspor Canva/berlisensi
 * tidak dipakai) → font OFL pengganti. `crop` = potongan screenshot referensi
 * [shot index, x, y, w, h] di lebar 430 sebagai contoh tampilan aslinya.
 */
const FONTS: Record<string, Omit<FontRow, "kb">[]> = {
  "tirai-beludru": [
    {
      original: "Sloop Script",
      replacement: "Pinyon Script",
      family: "var(--tb-script)",
      file: "pinyon-script.woff2",
      sample: "Nadia & Jorgi",
      size: 40,
      usage: "Nama di cover, nama mempelai, judul section",
      crop: [0, 80, 238, 280, 50],
    },
    {
      original: "SaveTheDate",
      replacement: "Italianno",
      family: "var(--tb-savedate)",
      file: "italianno.woff2",
      sample: "We're",
      size: 40,
      usage: '"We\'re", huruf G, judul kecil',
      crop: [0, 150, 145, 130, 40],
    },
    {
      original: "Cormorant / ClickPrompt",
      replacement: "Cormorant Garamond",
      family: "var(--tb-cormorant)",
      file: "cormorant-400-700.woff2",
      sample: "GETTING MARRIED",
      size: 26,
      usage: "Judul kapital, label",
      crop: [0, 80, 198, 270, 36],
    },
    {
      original: "Quattrocento",
      replacement: "Quattrocento (OFL asli)",
      family: "var(--tb-body)",
      file: "quattrocento-400.woff2",
      sample: "Putri Pertama dari Bapak Bambang Hermawan",
      size: 15,
      usage: "Teks isi, orang tua",
      crop: [2, 200, 350, 200, 45],
    },
    {
      original: "VerseSerif",
      replacement: "Noto Serif",
      family: "var(--tb-verse)",
      file: "noto-serif-400.woff2",
      sample: "Dan di antara tanda-tanda (kebesaran)-Nya",
      size: 15,
      usage: "Arti ayat",
    },
    {
      original: "(teks Arab)",
      replacement: "Amiri",
      family: "var(--tb-arabic)",
      file: "amiri-arabic.woff2",
      sample: "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ",
      size: 26,
      usage: "Ayat Arab (basmalah = aset SVG asli)",
    },
  ],
  "renda-rimba": [
    {
      original: "Lemon Tuesday",
      replacement: "Caveat Brush",
      family: "var(--rr-brush)",
      file: "caveat-brush.woff2",
      sample: "Annisa & Rizki",
      size: 64,
      usage: "Nama di cover & penutup",
      crop: [0, 0, 140, 400, 110],
    },
    {
      original: "FC Palette",
      replacement: "Caveat",
      family: "var(--rr-hand)",
      file: "caveat-date.woff2",
      sample: "13/12/2026",
      size: 22,
      usage: "Tanggal cover (subset angka saja)",
      crop: [0, 300, 240, 95, 35],
    },
    {
      original: "Nourd",
      replacement: "Jost",
      family: "var(--rr-sans)",
      file: "jost-300-500.woff2",
      sample: "The Wedding Of",
      size: 15,
      usage: "Cover, tombol, Wedding Gift",
      crop: [0, 150, 88, 130, 24],
    },
    {
      original: "Allura / Ballet",
      replacement: "Great Vibes",
      family: "var(--rr-script)",
      file: "great-vibes.woff2",
      sample: "Annisa Nurisma, S.T.",
      size: 33,
      usage: 'Nama mempelai, judul RSVP, "play the music!"',
      crop: [3, 90, 330, 240, 45],
    },
    {
      original: "Afrah",
      replacement: "Parisienne",
      family: "var(--rr-elegant)",
      file: "parisienne-titles.woff2",
      sample: "Wedding Gift",
      size: 42,
      usage: '"Our Gallery", "Wedding Gift" (subset huruf judul)',
      crop: [5, 90, 40, 230, 50],
    },
    {
      original: "Nickainley",
      replacement: "Kaushan Script",
      family: "var(--rr-casual)",
      file: "kaushan-titles.woff2",
      sample: "Desember",
      size: 50,
      usage: 'Nama bulan, "Kami Akan Menikah!" (subset huruf judul)',
      crop: [3, 120, 955, 190, 55],
    },
    {
      original: "Cormorant",
      replacement: "Cormorant Garamond",
      family: "var(--rr-serif)",
      file: "cormorant-400-700.woff2",
      sample: "SAVE THE DATE!",
      size: 28,
      usage: "Judul kapital, angka kalender",
      crop: [2, 100, 52, 230, 35],
    },
    {
      original: "Lora",
      replacement: "Lora (OFL asli)",
      family: "var(--rr-body)",
      file: "lora-400-600.woff2",
      sample: "Di antara tanda-tanda (kebesaran)-Nya ialah",
      size: 13,
      usage: "Teks isi, arti ayat, formulir",
      crop: [1, 70, 370, 300, 60],
    },
    {
      original: "(teks Arab)",
      replacement: "Amiri",
      family: "var(--rr-arabic)",
      file: "amiri-arabic.woff2",
      sample: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
      size: 25,
      usage: "Basmalah, ayat, salam",
      crop: [1, 120, 165, 200, 36],
    },
  ],
};

const LABEL: Record<string, string> = {
  "tirai-beludru": "Tirai Beludru (ref. Jorgi)",
  "renda-rimba": "Renda Rimba (ref. Subagja)",
};

/**
 * Perbandingan desain referensi (screenshot situs live) dengan tema hasil
 * adaptasi — HANYA development. Screenshot dibuat `pnpm ref:shots` ke
 * public/_ref/ & .reference/ (gitignored).
 */
export default async function BandingPage() {
  if (process.env.NODE_ENV === "production") notFound();

  let shots: {
    theme: string;
    index: number;
    key: string;
    label: string;
    file: string;
    width: number;
    height: number;
  }[] = [];
  try {
    shots = JSON.parse(
      await fs.readFile(path.join(process.cwd(), ".reference/shots.json"), "utf8"),
    ).shots;
  } catch {
    /* belum dijalankan */
  }
  if (shots.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl">Belum ada screenshot referensi</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Jalankan <code className="rounded bg-neutral-100 px-1.5 py-0.5">pnpm ref:shots</code>{" "}
          untuk memotret situs referensi live.
        </p>
      </main>
    );
  }

  const fontKb = async (file: string) => {
    try {
      return Math.round(
        (await fs.stat(path.join(process.cwd(), "src/themes/_fonts", file))).size / 1024,
      );
    } catch {
      return null;
    }
  };

  const themes: ThemeShots[] = await Promise.all(
    Object.keys(SECTION_OF).map(async (theme) => ({
      theme,
      label: LABEL[theme],
      shots: shots
        .filter((s) => s.theme === theme)
        .sort((a, b) => a.index - b.index)
        .map((s) => ({ ...s, section: SECTION_OF[theme][s.key] ?? null })),
      fonts: await Promise.all(FONTS[theme].map(async (f) => ({ ...f, kb: await fontKb(f.file) }))),
    })),
  );

  return (
    <div className={`${tiraiFonts} ${rendaFonts}`}>
      <Banding themes={themes} />
    </div>
  );
}
