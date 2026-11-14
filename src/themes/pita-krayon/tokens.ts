import type { ColorVariant } from "../types";

/**
 * Varian Pita Krayon. Ornamen asli (pita, topi, bingkai) berwarna merah →
 * diwarnai ulang per varian lewat `--inv-filter-tint` (filter CSS; nilai netral
 * `saturate(1)`, tidak pernah `none`). Angka krayon & teks memakai warna
 * token langsung.
 *
 *  --inv-red     judul, tombol, angka hitung mundur
 *  --inv-deep    merah tua (tombol, kalender, nama tamu)
 *  --inv-crayon  isi angka krayon
 *  --inv-ink     teks isi (desain: hitam)
 *  --inv-card    kartu pemutar musik (gelap)
 *  --inv-note    kertas catatan (kartu ucapan)
 */
export const VARIANTS = [
  {
    id: "merah-pita",
    name: "Merah Pita",
    swatch: ["#9e0e00", "#f5f2f0", "#ae5351"],
    tokens: {
      "--inv-bg": "#f5f2f0",
      "--inv-bg-alt": "#efe9e5",
      "--inv-surface": "#fffdfb",
      "--inv-surface-text": "#1b1918",
      "--inv-text": "#1b1918",
      "--inv-text-muted": "#6b625d",
      "--inv-primary": "#9e0e00",
      "--inv-primary-text": "#ffffff",
      "--inv-title": "#9e0e00",
      "--inv-accent": "#ae5351",
      "--inv-backdrop": "linear-gradient(160deg, #efe6e1 0%, #f5f2f0 50%, #ead9d4 100%)",
      "--inv-red": "#9e0e00",
      "--inv-deep": "#820e03",
      "--inv-crayon": "#a72b2e",
      "--inv-crayon-edge": "#7d1214",
      "--inv-ink": "#1b1918",
      "--inv-card": "#1b1a19",
      "--inv-note": "#fffdf8",
      "--inv-line": "rgb(158 14 0 / 0.18)",
      "--inv-filter-tint": "saturate(1)",
    },
  },
  {
    id: "biru-denim",
    name: "Biru Denim",
    swatch: ["#1f3f8f", "#f1f3f6", "#6d86c4"],
    tokens: {
      "--inv-bg": "#f1f3f6",
      "--inv-bg-alt": "#e7ebf2",
      "--inv-surface": "#fcfdff",
      "--inv-surface-text": "#16181d",
      "--inv-text": "#16181d",
      "--inv-text-muted": "#5c6372",
      "--inv-primary": "#1f3f8f",
      "--inv-primary-text": "#ffffff",
      "--inv-title": "#1f3f8f",
      "--inv-accent": "#6d86c4",
      "--inv-backdrop": "linear-gradient(160deg, #e2e8f2 0%, #f1f3f6 50%, #d9e1ef 100%)",
      "--inv-red": "#1f3f8f",
      "--inv-deep": "#152c66",
      "--inv-crayon": "#2f55b0",
      "--inv-crayon-edge": "#1a336f",
      "--inv-ink": "#16181d",
      "--inv-card": "#141a28",
      "--inv-note": "#fbfcff",
      "--inv-line": "rgb(31 63 143 / 0.18)",
      "--inv-filter-tint": "hue-rotate(218deg) saturate(1.15) brightness(0.92)",
    },
  },
  {
    id: "pink-stroberi",
    name: "Pink Stroberi",
    swatch: ["#c2185b", "#fbf1f2", "#e58aa8"],
    tokens: {
      "--inv-bg": "#fbf1f2",
      "--inv-bg-alt": "#f7e6ea",
      "--inv-surface": "#fffafb",
      "--inv-surface-text": "#2a171d",
      "--inv-text": "#2a171d",
      "--inv-text-muted": "#7a5b65",
      "--inv-primary": "#c2185b",
      "--inv-primary-text": "#ffffff",
      "--inv-title": "#c2185b",
      "--inv-accent": "#e58aa8",
      "--inv-backdrop": "linear-gradient(160deg, #f8dfe6 0%, #fbf1f2 50%, #f3d3dd 100%)",
      "--inv-red": "#c2185b",
      "--inv-deep": "#8e1043",
      "--inv-crayon": "#d6336f",
      "--inv-crayon-edge": "#951247",
      "--inv-ink": "#2a171d",
      "--inv-card": "#2a1620",
      "--inv-note": "#fffbfc",
      "--inv-line": "rgb(194 24 91 / 0.18)",
      "--inv-filter-tint": "hue-rotate(332deg) saturate(1.25) brightness(1.12)",
    },
  },
] as const satisfies readonly ColorVariant[];
