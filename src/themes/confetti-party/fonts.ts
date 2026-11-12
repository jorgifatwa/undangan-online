import localFont from "next/font/local";

/**
 * Font tema dimuat lewat next/font dan HANYA diimpor oleh index.tsx tema ini.
 * preload: false — semua tema terdaftar di satu rute (/u, /preview), dan
 * preload next/font akan membuat SETIAP undangan mengunduh font semua tema.
 * Tanpa preload, browser hanya mengunduh font yang benar-benar dipakai teks
 * di halaman (CSS @font-face ada di <head>, teks cover dirender di server).
 */
const cpDisplay = localFont({
  src: "../_fonts/fredoka-500-700.woff2",
  weight: "500 700",
  variable: "--font-cp-display",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});
const cpBody = localFont({
  src: "../_fonts/nunito-400-700.woff2",
  weight: "400 700",
  variable: "--font-cp-body",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

const cpArabic = localFont({
  src: "../_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--font-cp-arabic",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

export const fontClassName = `${cpDisplay.variable} ${cpBody.variable} ${cpArabic.variable}`;
