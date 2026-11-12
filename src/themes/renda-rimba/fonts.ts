import localFont from "next/font/local";

/**
 * Font Renda Rimba — padanan OFL untuk font desain referensi (font ekspor
 * Canva tidak dipakai), di-subset oleh `pnpm fonts:build` (src/themes/_fonts/,
 * lisensi di _fonts/licenses/):
 *   Nourd → Jost                     Lemon Tuesday → Caveat Brush
 *   FC Palette → Caveat (tanggal)    Allura / Ballet → Great Vibes
 *   Afrah → Parisienne               Nickainley → Kaushan Script
 *   Cormorant → Cormorant Garamond   Lora → Lora   Arab → Amiri
 * Semua `display: swap` + `preload: false` (tema berbagi satu rute; preload
 * membuat setiap undangan mengunduh font semua tema). Cover hanya butuh
 * Jost + Caveat Brush + Caveat (subset angka tanggal, 3 KB).
 * next/font menuntut objek opsi literal → opsi ditulis per font. Nama konstanta
 * menjadi nama font-family → WAJIB unik antartema (awalan tema), kalau tidak
 * @font-face tema lain bertabrakan dan ikut terunduh.
 */
const rrSans = localFont({
  src: "../_fonts/jost-300-500.woff2",
  weight: "300 500",
  variable: "--rr-sans",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});
const rrBrush = localFont({
  src: "../_fonts/caveat-brush.woff2",
  weight: "400",
  variable: "--rr-brush",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const rrHand = localFont({
  src: "../_fonts/caveat-date.woff2",
  weight: "400",
  variable: "--rr-hand",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const rrScript = localFont({
  src: "../_fonts/great-vibes.woff2",
  weight: "400",
  variable: "--rr-script",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const rrElegant = localFont({
  src: "../_fonts/parisienne-titles.woff2",
  weight: "400",
  variable: "--rr-elegant",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const rrCasual = localFont({
  src: "../_fonts/kaushan-titles.woff2",
  weight: "400",
  variable: "--rr-casual",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const rrSerif = localFont({
  src: [
    { path: "../_fonts/cormorant-400-700.woff2", weight: "400 700", style: "normal" },
    { path: "../_fonts/cormorant-italic-titles.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--rr-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const rrBody = localFont({
  src: [
    { path: "../_fonts/lora-400-600.woff2", weight: "400 600", style: "normal" },
    { path: "../_fonts/lora-italic-400.woff2", weight: "400", style: "italic" },
  ],
  variable: "--rr-body",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const rrArabic = localFont({
  src: "../_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--rr-arabic",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

export const fontClassName = [
  rrSans,
  rrBrush,
  rrHand,
  rrScript,
  rrElegant,
  rrCasual,
  rrSerif,
  rrBody,
  rrArabic,
]
  .map((f) => f.variable)
  .join(" ");
