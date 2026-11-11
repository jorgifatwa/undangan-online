import { Fredoka, Nunito } from "next/font/google";

/**
 * Font tema dimuat lewat next/font dan HANYA diimpor oleh index.tsx tema ini.
 * Karena tema dimuat lazy oleh registry, CSS & file font ikut terpisah per tema.
 */
const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cp-display",
  display: "swap",
});
const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cp-body",
  display: "swap",
});

export const fontClassName = `${display.variable} ${body.variable}`;
