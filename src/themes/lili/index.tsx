"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { LiliCover } from "./sections/Cover";
import { LiliHero } from "./sections/Hero";
import "./theme.css";

/**
 * Lili — surat cinta sage & pink, digambar ulang dari desain referensi
 * (screenshot video; kanvas 430 px). Semua ornamen SVG orisinal di ./art.
 * Section dikerjakan bertahap; yang belum di-override memakai _shared.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  Cover: LiliCover,
  sections: {
    hitungMundur: LiliHero,
  },
};

export default function LiliTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
