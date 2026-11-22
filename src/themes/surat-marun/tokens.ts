import type { ColorVariant } from "../types";

/**
 * Varian warna Surat Marun. "Marun" = palet desain referensi (diambil dari
 * piksel screenshot: marun #45171a, hijau botol #14301c, kertas linen
 * #eae7e2, teks hijau tua #263f2a). Varian lain mengganti marun & hijau.
 */
const shared = {
  "--inv-paper": "#eae7e2",
  "--inv-paper-dark": "#d9d4cc",
  "--inv-cream": "#f3eee6",
  "--inv-surface": "#f3eee6",
  "--inv-primary-text": "#f3eee6",
  "--inv-text-muted": "#b9a9a4",
} as const;

export const VARIANTS: readonly ColorVariant[] = [
  {
    id: "marun",
    name: "Marun",
    swatch: ["#45171a", "#14301c", "#eae7e2"],
    tokens: {
      ...shared,
      "--inv-maroon": "#45171a",
      "--inv-maroon-light": "#5e2328",
      "--inv-bottle": "#14301c",
      "--inv-ink": "#263f2a",
      "--inv-bg": "#45171a",
      "--inv-bg-alt": "#14301c",
      "--inv-text": "#f3eee6",
      "--inv-primary": "rgb(69 23 26 / 0.88)",
      "--inv-surface-text": "#263f2a",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #5e2328 0%, #1f0a0c 75%)",
    },
  },
  {
    id: "navy",
    name: "Navy",
    swatch: ["#1b2640", "#3a2a1c", "#ece8e1"],
    tokens: {
      ...shared,
      "--inv-paper": "#ece8e1",
      "--inv-maroon": "#1b2640",
      "--inv-maroon-light": "#2a3a5c",
      "--inv-bottle": "#3a2a1c",
      "--inv-ink": "#1b2640",
      "--inv-bg": "#1b2640",
      "--inv-bg-alt": "#3a2a1c",
      "--inv-text": "#f3eee6",
      "--inv-primary": "rgb(27 38 64 / 0.88)",
      "--inv-surface-text": "#1b2640",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #2a3a5c 0%, #0c1220 75%)",
    },
  },
  {
    id: "zaitun",
    name: "Zaitun",
    swatch: ["#3d4527", "#5a2a1e", "#ebe6da"],
    tokens: {
      ...shared,
      "--inv-paper": "#ebe6da",
      "--inv-maroon": "#3d4527",
      "--inv-maroon-light": "#525c36",
      "--inv-bottle": "#5a2a1e",
      "--inv-ink": "#3d4527",
      "--inv-bg": "#3d4527",
      "--inv-bg-alt": "#5a2a1e",
      "--inv-text": "#f3eee6",
      "--inv-primary": "rgb(61 69 39 / 0.88)",
      "--inv-surface-text": "#3d4527",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #525c36 0%, #1a1e10 75%)",
    },
  },
];
