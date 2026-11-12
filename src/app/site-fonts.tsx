import localFont from "next/font/local";

/**
 * Font WEBSITE (landing, auth, dashboard, galeri tema).
 * Sengaja tidak dipasang di root layout: next/font mem-preload font di setiap
 * rute yang memakainya, dan halaman undangan tidak butuh font ini (~160 KB yang
 * berebut bandwidth dengan font tema di jaringan lambat).
 */
// File subset OFL dari `pnpm fonts:build` (tanpa unduhan Google Fonts saat build).
const siteJakarta = localFont({
  src: "../themes/_fonts/site-jakarta-300-700.woff2",
  weight: "300 700",
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const siteFraunces = localFont({
  src: "../themes/_fonts/site-fraunces-400-600.woff2",
  weight: "400 600",
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/** Pasang di elemen pembungkus halaman website. */
export const siteFontClass = `${siteJakarta.variable} ${siteFraunces.variable} font-sans`;

export function SiteFonts({ children }: { children: React.ReactNode }) {
  return <div className={siteFontClass}>{children}</div>;
}
