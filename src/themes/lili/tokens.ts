import type { ColorVariant } from "../types";

/**
 * Varian warna Lili. "Sage" = palet asli desain referensi (diambil dari piksel
 * screenshot: latar sage #6f744d, kertas #ebe4d7, pink #f8c1d6, teks
 * #3b3f2e). Varian lain diturunkan dengan pola yang sama. Ornamen SVG hanya
 * membaca token ini.
 */
const shared = {
  "--inv-lace": "#f8f5ee",
  "--inv-lace-shade": "#d9d6cb",
  "--inv-cream": "#f2ecdc",
  "--inv-surface": "#f2ecdc",
  "--inv-primary-text": "#f2ecdc",
} as const;

export const VARIANTS: readonly ColorVariant[] = [
  {
    id: "sage",
    name: "Sage",
    swatch: ["#6f744d", "#f8c1d6", "#ebe4d7"],
    tokens: {
      ...shared,
      "--inv-sage": "#6f744d",
      "--inv-sage-dark": "#5c6140",
      "--inv-sage-light": "#878b68",
      "--inv-paper": "#ebe4d7",
      "--inv-paper-dark": "#d9d1c1",
      "--inv-pink": "#f8c1d6",
      "--inv-pink-soft": "#f4d6dc",
      "--inv-pink-text": "#f1cdd5",
      "--inv-ink": "#3b3f2e",
      "--inv-seal": "#c9c9be",
      "--inv-seal-dark": "#9b9a8e",
      "--inv-bg": "#ebe4d7",
      "--inv-bg-alt": "#6f744d",
      "--inv-text": "#3b3f2e",
      "--inv-text-muted": "#6b6d5a",
      "--inv-primary": "rgb(59 63 46 / 0.85)",
      "--inv-surface-text": "#3b3f2e",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #878d6c 0%, #3f4530 75%)",
    },
  },
  {
    id: "biru",
    name: "Biru Kabut",
    swatch: ["#5f7482", "#f3c9cf", "#e9e6e0"],
    tokens: {
      ...shared,
      "--inv-sage": "#5f7482",
      "--inv-sage-dark": "#4e616e",
      "--inv-sage-light": "#7d909c",
      "--inv-paper": "#e9e6e0",
      "--inv-paper-dark": "#d6d2ca",
      "--inv-pink": "#f3c9cf",
      "--inv-pink-soft": "#f2dade",
      "--inv-pink-text": "#f3d5da",
      "--inv-ink": "#2f3a42",
      "--inv-seal": "#d5d8da",
      "--inv-seal-dark": "#a3a8ac",
      "--inv-bg": "#e9e6e0",
      "--inv-bg-alt": "#5f7482",
      "--inv-text": "#2f3a42",
      "--inv-text-muted": "#5e6a72",
      "--inv-primary": "rgb(47 58 66 / 0.85)",
      "--inv-surface-text": "#2f3a42",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #7d909c 0%, #34424b 75%)",
    },
  },
  {
    id: "mauve",
    name: "Mauve",
    swatch: ["#8a6a72", "#f6d0d6", "#eee5df"],
    tokens: {
      ...shared,
      "--inv-sage": "#8a6a72",
      "--inv-sage-dark": "#74575e",
      "--inv-sage-light": "#a2868d",
      "--inv-paper": "#eee5df",
      "--inv-paper-dark": "#ddd1ca",
      "--inv-pink": "#f6d0d6",
      "--inv-pink-soft": "#f5e0e2",
      "--inv-pink-text": "#f8dde1",
      "--inv-ink": "#46333a",
      "--inv-seal": "#e0d6d4",
      "--inv-seal-dark": "#b3a4a2",
      "--inv-bg": "#eee5df",
      "--inv-bg-alt": "#8a6a72",
      "--inv-text": "#46333a",
      "--inv-text-muted": "#7a646a",
      "--inv-primary": "rgb(70 51 58 / 0.85)",
      "--inv-surface-text": "#46333a",
      "--inv-backdrop": "radial-gradient(ellipse at 50% 30%, #a2868d 0%, #4d373e 75%)",
    },
  },
];
