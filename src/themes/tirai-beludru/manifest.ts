import type { ThemeManifest } from "../types";
import { TIRAI_VARIANTS } from "./tokens";

/**
 * Tirai Beludru — adaptasi desain "Undangan Jorgi Estetik" milik pemilik.
 * Section `salam` menyatu di profil, `rsvp` menyatu di ucapan, dan tombol
 * peta ada di section acara (sesuai desain asli) — jadi ketiganya tidak
 * tercantum. Love story, dress code & live streaming memakai section
 * default yang di-styling tema.
 */
export const manifest = {
  id: "tirai-beludru",
  name: "Tirai Beludru",
  description:
    "Panggung teater: tirai beludru zamrud, amplop bersegel lilin yang terbuka, kartu renda, dan bunga kering.",
  category: "elegan",
  eventTypes: ["WEDDING"],
  minPackage: "PREMIUM",
  variants: TIRAI_VARIANTS,
  sections: [
    "cover",
    "ayat",
    "profil",
    "loveStory",
    "acara",
    "hitungMundur",
    "dressCode",
    "liveStream",
    "amplop",
    "ucapan",
    "galeri",
    "penutup",
  ],
  // Kartu ayat = tujuan transisi amplop di cover → selalu section pertama.
  lockedSections: ["ayat"],
  thumbnail: {
    background: "radial-gradient(ellipse at 50% 40%, #2f6347 0%, #123524 45%, #05130c 100%)",
    foreground: "#faf3ed",
  },
  defaultMusic: {
    url: "/placeholders/music/tirai-beludru.m4a",
    title: "Wedding Music",
    artist: "ikoliks",
  },
} as const satisfies ThemeManifest;
