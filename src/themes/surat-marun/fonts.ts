import localFont from "next/font/local";

/**
 * Font Surat Marun — padanan OFL font desain referensi (di-subset oleh
 * `pnpm fonts:build`, lisensi di _fonts/licenses/):
 *   nama & judul serif ramping (tegak/miring) → Instrument Serif
 *   teks kecil, label, tombol               → DM Sans
 *   judul skrip ("Wedding Gift", "Thank You") → Pinyon Script
 * Cover: Instrument Serif (2 file) + DM Sans. Nama konstanta berawalan `sm`.
 */
const smSerif = localFont({
  src: [
    { path: "../_fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "../_fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--sm-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const smSans = localFont({
  src: "../_fonts/dm-sans-400-700.woff2",
  weight: "400 700",
  variable: "--sm-sans",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});
const smScript = localFont({
  src: "../_fonts/pinyon-script.woff2",
  weight: "400",
  variable: "--sm-script",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});

export const fontClassName = [smSerif, smSans, smScript].map((f) => f.variable).join(" ");
