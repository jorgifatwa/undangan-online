"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { LiliCover } from "./sections/Cover";
import { LiliCouple } from "./sections/Couple";
import { LiliEvent } from "./sections/Event";
import { LiliGallery } from "./sections/Gallery";
import { LiliGift } from "./sections/Gift";
import { LiliLoveStory } from "./sections/LoveStory";
import { LiliHero } from "./sections/Hero";
import { LiliSalam } from "./sections/Salam";
import { LiliSaveDate } from "./sections/SaveDate";
import { LiliWishes } from "./sections/Wishes";
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
    salam: LiliSalam,
    profil: LiliCouple,
    ayat: LiliSaveDate,
    acara: LiliEvent,
    amplop: LiliGift,
    galeri: LiliGallery,
    loveStory: LiliLoveStory,
    ucapan: LiliWishes,
  },
};

export default function LiliTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
