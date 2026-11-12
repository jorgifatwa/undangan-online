import type { Metadata } from "next";
import { Amiri, Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";

import { OrnamentGallery } from "./OrnamentGallery";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  preload: false,
  display: "swap",
});
const notoSerif = Noto_Serif({
  subsets: ["latin"],
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
