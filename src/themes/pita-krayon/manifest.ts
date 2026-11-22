import type { ThemeManifest } from "../types";
import { VARIANTS } from "./tokens";

/**
 * Pita Krayon — scrapbook coretan ala Gen Z: pita merah tipis, kilau pensil,
 * angka umur bertekstur krayon, kalender miring, strip foto photobooth.
 * Diadaptasi dari desain Canva milik pemilik ("Aya's Ride to 19th",
 * pleasurein.my.id/genz-birhday). Status aset: src/themes/ASSET-AUDIT.md
 * (bagian Pita Krayon, status "dev" sampai dicek pemilik).
 */
export const manifest = {
  id: "pita-krayon",
  name: "Pita Krayon",
  description:
    "Scrapbook coretan ala Gen Z: angka umur bertekstur krayon, pita merah, kalender miring, strip foto, dan kartu ucapan yang hidup.",
  category: "modern",
  eventTypes: ["BIRTHDAY"],
  price: 149_000,
  variants: VARIANTS,
  sections: [
    "cover",
    "salam",
    "ayat",
    "profil",
    "acara",
    "dressCode",
    "liveStream",
    "ucapan",
    "cerita",
    "hitungMundur",
    "galeri",
    "amplop",
    "penutup",
  ],
  // Urutan desain: pembuka (angka krayon) → kutipan + pemutar → salam & profil
  // → save the date → ucapan → cerita → hitung mundur + strip foto.
  sectionOrder: [
    "cover",
    "salam",
    "ayat",
    "profil",
    "acara",
    "dressCode",
    "liveStream",
    "ucapan",
    "cerita",
    "hitungMundur",
    "galeri",
    "amplop",
    "penutup",
  ],
  // Pembuka (angka krayon) & kartu pemutar musik selalu tampil tepat setelah
  // cover — pemutar tetap ada walau kutipan kosong.
  lockedSections: ["salam", "ayat"],
  // teks salam di bagian profil; foto cover & pembuka → bagian pembuka; pemutar di kartu kutipan
  editorFocus: { salam: "profil", foto: "salam", musik: "ayat" },
  editorFields: ["childPhoto", "decorLanguage", "photoDecor", "countdownStrip", "musicPhoto"],
  thumbnail: {
    background: "linear-gradient(160deg, #f5f2f0 0%, #ead9d4 100%)",
    foreground: "#9e0e00",
  },
  // Sementara memakai lagu ulang tahun bawaan (sudah AAC 96 kbps);
  // ganti dengan lagu khusus tema lewat `pnpm music:optimize`.
  defaultMusic: {
    url: "/placeholders/music/confetti-party.m4a",
    title: "Kids School - Happy Birthday Music",
    artist: "SigmaMusicArt",
  },
} as const satisfies ThemeManifest;
