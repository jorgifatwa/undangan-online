import type { ThemeManifest } from "../types";
import { VARIANTS } from "./tokens";

/**
 * Lili — surat cinta bernuansa sage & pink: amplop berenda dengan segel
 * lilin mawar, kertas krem bertekstur, bingkai oval & bingkai renda, serta
 * lili, anggrek, dan gladiol. Semua ornamen digambar ulang sebagai SVG
 * orisinal (src/themes/lili/art/), tanpa file aset referensi.
 * `rsvp` menyatu di form "Ucapkan Sesuatu" (section ucapan), seperti desain.
 */
export const manifest = {
  id: "lili",
  name: "Lili",
  description:
    "Surat cinta sage & pink: amplop berenda bersegel mawar, bingkai oval, lili, anggrek, dan sepasang angsa.",
  category: "elegan",
  eventTypes: ["WEDDING"],
  price: 99_000,
  variants: VARIANTS,
  sections: [
    "cover",
    "hitungMundur",
    "salam",
    "profil",
    "ayat",
    "acara",
    "amplop",
    "galeri",
    "loveStory",
    "dressCode",
    "liveStream",
    "ucapan",
    "penutup",
  ],
  // urutan desain: hero + hitung mundur → salam → mempelai → Save The Date → acara
  sectionOrder: [
    "cover",
    "hitungMundur",
    "salam",
    "profil",
    "ayat",
    "acara",
    "amplop",
    "galeri",
    "loveStory",
    "dressCode",
    "liveStream",
    "ucapan",
    "penutup",
  ],
  // foto oval hero (cover), foto per mempelai di bingkai renda, foto oval penutup
  weddingPhotos: ["cover", "couple", "closing"],
  thumbnail: {
    background: "linear-gradient(160deg, #878d6c 0%, #5b6243 100%)",
    foreground: "#f1cdd5",
  },
} as const satisfies ThemeManifest;
