import type { ThemeManifest } from "../types";
import { VARIANTS } from "./tokens";

/**
 * Surat Marun — marun & hijau botol dengan kartu linen krem: cover kartu
 * bingkai oval timbul, renda oval nama, kartu "The Bride/Groom", tanggal
 * berbingkai, amplop acara, polaroid, kartu hadiah, dan kartu terima kasih.
 * Diadaptasi dari desain referensi yang hak desainnya dimiliki pemilik;
 * semua ornamen digambar ulang (src/themes/surat-marun/art/).
 */
export const manifest = {
  id: "surat-marun",
  name: "Surat Marun",
  description:
    "Marun & hijau botol berpadu kartu linen: bingkai oval timbul, renda oval, amplop acara, polaroid, dan kartu terima kasih.",
  category: "elegan",
  eventTypes: ["WEDDING"],
  price: 99_000,
  variants: VARIANTS,
  sections: [
    "cover",
    "ayat",
    "profil",
    "hitungMundur",
    "acara",
    "dressCode",
    "galeri",
    "loveStory",
    "liveStream",
    "amplop",
    "ucapan",
    "penutup",
  ],
  sectionOrder: [
    "cover",
    "ayat",
    "profil",
    "hitungMundur",
    "acara",
    "dressCode",
    "galeri",
    "loveStory",
    "liveStream",
    "amplop",
    "ucapan",
    "penutup",
  ],
  weddingPhotos: ["cover", "couple", "strip", "closing"],
  thumbnail: {
    background: "linear-gradient(160deg, #5e2328 0%, #2a0d10 100%)",
    foreground: "#eae7e2",
  },
} as const satisfies ThemeManifest;
