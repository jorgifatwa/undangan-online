import { Fredoka, Nunito } from "next/font/google";

/**
 * Font tema dimuat lewat next/font dan HANYA diimpor oleh index.tsx tema ini.
 * preload: false — semua tema terdaftar di satu rute (/u, /preview), dan
 * preload next/font akan membuat SETIAP undangan mengunduh font semua tema.
 * Tanpa preload, browser hanya mengunduh font yang benar-benar dipakai teks
 * di halaman (CSS @font-face ada di <head>, teks cover dirender di server).
 */
const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cp-display",
  display: "swap",
  preload: false,
});
const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cp-body",
  display: "swap",
  preload: false,
});

export const fontClassName = `${display.variable} ${body.variable}`;
