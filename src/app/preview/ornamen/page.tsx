import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";

import { OrnamentGallery } from "./OrnamentGallery";

const amiri = localFont({
  src: "../../../themes/_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--font-amiri",
  preload: false,
  display: "swap",
});
const notoSerif = localFont({
  src: "../../../themes/_fonts/noto-serif-400.woff2",
  weight: "400",
  variable: "--font-noto-serif",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = { title: "Pratinjau Ornamen", robots: { index: false } };

/** Galeri ornamen & tekstur bersama — HANYA di development. */
export default function OrnamentPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className={`${amiri.variable} ${notoSerif.variable}`}>
      <OrnamentGallery />
    </div>
  );
}
