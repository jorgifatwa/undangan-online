import localFont from "next/font/local";

/**
 * Font Tirai Beludru — padanan OFL untuk font desain referensi (font ekspor
 * Canva tidak dipakai), di-subset oleh `pnpm fonts:build` (src/themes/_fonts/,
 * lisensi di _fonts/licenses/):
 *   Sloop Script → Pinyon Script     SaveTheDate → Italianno
 *   Cormorant / ClickPrompt → Cormorant Garamond
 *   VerseSerif → Noto Serif          Quattrocento → Quattrocento (OFL asli)
 *   teks Arab → Amiri
 * Cormorant & Amiri memakai FILE YANG SAMA dengan Renda Rimba (cache bersama).
 * Semua `display: swap` + `preload: false` — lihat catatan di confetti-party/fonts.ts.
 * Nama konstanta = nama font-family → wajib berawalan tema (tb…).
 */
const tbScript = localFont({
  src: "../_fonts/pinyon-script.woff2",
  weight: "400",
  variable: "--tb-script",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const tbSaveDate = localFont({
  src: "../_fonts/italianno.woff2",
  weight: "400",
  variable: "--tb-savedate",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const tbCormorant = localFont({
  src: "../_fonts/cormorant-400-700.woff2",
  weight: "400 700",
  variable: "--tb-cormorant",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const tbVerse = localFont({
  src: "../_fonts/noto-serif-400.woff2",
  weight: "400",
  variable: "--tb-verse",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const tbBody = localFont({
  src: [
    { path: "../_fonts/quattrocento-400.woff2", weight: "400", style: "normal" },
    { path: "../_fonts/quattrocento-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--tb-body",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const tbArabic = localFont({
  src: "../_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--tb-arabic",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

export const fontClassName = [tbScript, tbSaveDate, tbCormorant, tbVerse, tbBody, tbArabic]
  .map((f) => f.variable)
  .join(" ");
