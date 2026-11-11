import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Font WEBSITE (landing, auth, dashboard, galeri tema).
 * Sengaja tidak dipasang di root layout: next/font mem-preload font di setiap
 * rute yang memakainya, dan halaman undangan tidak butuh font ini (~160 KB yang
 * berebut bandwidth dengan font tema di jaringan lambat).
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

/** Pasang di elemen pembungkus halaman website. */
export const siteFontClass = `${jakarta.variable} ${fraunces.variable} font-sans`;

export function SiteFonts({ children }: { children: React.ReactNode }) {
  return <div className={siteFontClass}>{children}</div>;
}
