import type { ThemeManifest } from "../types";
import { RENDA_VARIANTS } from "./tokens";

/**
 * Renda Rimba — adaptasi desain "Undangan Subagja" milik pemilik.
 * `salam` menyatu di kartu mempelai, `rsvp` menyatu di kartu "Konfirmasi
 * Kehadiran" (section ucapan), dan tombol peta ada di kartu acara — sesuai
 * desain asli — jadi ketiganya tidak tercantum. Love story, dress code & live
 * streaming tidak ada di desain asli; tampil dengan gaya tema (Extras.tsx).
 */
export const manifest = {
  id: "renda-rimba",
  name: "Renda Rimba",
  description:
    "Hutan tropis dan renda putih: pintu daun yang terbuka, bingkai scallop, piringan hitam, polaroid, dan bunga anthurium.",
  category: "elegan",
  eventTypes: ["WEDDING"],
  minPackage: "BASIC",
  variants: RENDA_VARIANTS,
  sections: [
    "cover",
    "ayat",
    "hitungMundur",
    "profil",
    "acara",
    "loveStory",
    "dressCode",
    "liveStream",
    "galeri",
    "amplop",
    "ucapan",
    "penutup",
  ],
  thumbnail: {
    background: "radial-gradient(ellipse at 50% 35%, #3e6340 0%, #1d3a22 45%, #05170a 100%)",
    foreground: "#f6efe4",
  },
  defaultMusic: {
    url: "/placeholders/music/renda-rimba.m4a",
    title: "Romantic Wedding Acoustic Guitar",
    artist: "Tunetank",
  },
} as const satisfies ThemeManifest;
