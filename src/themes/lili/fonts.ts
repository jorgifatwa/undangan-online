import localFont from "next/font/local";

/**
 * Font Lili — padanan OFL untuk font desain referensi (di-subset oleh
 * `pnpm fonts:build`, lisensi di _fonts/licenses/):
 *   serif judul & teks (tegak/miring)  → Playfair Display
 *   nama skrip "Clarissa & Dimas"       → Pinyon Script (+ "&" Great Vibes, 1 glyph)
 *   tulisan tangan "The Wedding"        → Sacramento (subset 11 huruf)
 *   bismillah                           → Amiri
 * Cover: Playfair (2 file) + Pinyon Script + subset "&" (1 KB).
 * Semua `display: swap` + `preload: false`; nama konstanta berawalan `li`
 * agar @font-face tidak bertabrakan dengan tema lain.
 */
const liSerif = localFont({
  src: [
    { path: "../_fonts/playfair-400-600.woff2", weight: "400 600", style: "normal" },
    { path: "../_fonts/playfair-italic-400-700.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--li-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const liScript = localFont({
  src: "../_fonts/pinyon-script.woff2",
  weight: "400",
  variable: "--li-script",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
// "&" klasik berlengkung seperti desain (Pinyon punya "&" bergaya "Et");
// subset 1 glyph (±1 KB)
const liAmp = localFont({
  src: "../_fonts/great-vibes-amp.woff2",
  weight: "400",
  variable: "--li-amp",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const liHand = localFont({
  src: "../_fonts/sacramento-wedding.woff2",
  weight: "400",
  variable: "--li-hand",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});
const liArabic = localFont({
  src: "../_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--li-arabic",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

export const fontClassName = [liSerif, liScript, liAmp, liHand, liArabic]
  .map((f) => f.variable)
  .join(" ");
