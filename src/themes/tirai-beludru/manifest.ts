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
  price: 149_000,
  variants: TIRAI_VARIANTS,
  // pilihan ilustrasi bangunan di section acara (gedung kota / rumah)
  editorFields: ["venueArt"],
  // pemutar musik ada di kartu ayat
  editorFocus: { musik: "ayat" },
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
  // Urutan bawaan tema: love story (latar beludru marun seperti foto mempelai)
  // tepat sebelum ucapan; hitung mundur tepat setelah acara (menyatu).
  sectionOrder: [
    "cover",
    "ayat",
    "salam",
    "profil",
    "acara",
    "hitungMundur",
    "maps",
    "dressCode",
    "liveStream",
    "amplop",
    "rsvp",
    "loveStory",
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
