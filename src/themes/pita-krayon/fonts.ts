import localFont from "next/font/local";

/**
 * Font Pita Krayon — padanan OFL untuk font desain referensi (font Canva tidak
 * dipakai), di-subset oleh `pnpm fonts:build` (src/themes/_fonts/):
 *   FF Providence Sans (Regular & Bold) → Gaegu 400 & 700 (Latin saja)
 *   Arimo Bold Italic (angka hitung mundur) → Arimo, hanya "0–9:"
 * Total ±25 KB. Semua `display: swap` + `preload: false`. Nama konstanta =
 * nama font-family → berawalan tema (pk…).
 */
const pkHand = localFont({
  src: [
    { path: "../_fonts/gaegu-400.woff2", weight: "400", style: "normal" },
    { path: "../_fonts/gaegu-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--pk-hand",
  display: "swap",
  preload: false,
  fallback: ["'Comic Sans MS'", "cursive"],
});
const pkCount = localFont({
  src: "../_fonts/arimo-countdown.woff2",
  weight: "700",
  style: "italic",
  variable: "--pk-count",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
});

export const fontClassName = [pkHand, pkCount].map((f) => f.variable).join(" ");
