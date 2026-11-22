"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { SuratMarunClosing } from "./sections/Closing";
import { SuratMarunCouple } from "./sections/Couple";
import { SuratMarunCover } from "./sections/Cover";
import { SuratMarunEvent } from "./sections/Event";
import {
  SuratMarunDressCode,
  SuratMarunGallery,
  SuratMarunLiveStream,
  SuratMarunLoveStory,
} from "./sections/Extras";
import { SuratMarunGift } from "./sections/Gift";
import { SuratMarunOpening } from "./sections/Opening";
import { SuratMarunWishes } from "./sections/Wishes";
import "./theme.css";

/**
 * Surat Marun. Section yang tidak di-override memakai section default _shared
 * (diwarnai token varian). Override per section lewat `sections`, cover
 * lewat `Cover`, efek lewat `Ambient`.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  Cover: SuratMarunCover,
  // isi disiapkan di balik cover → membuka cover hanya menjalankan animasi
  prepareBehindCover: true,
  sections: {
    ayat: SuratMarunOpening,
    profil: SuratMarunCouple,
    acara: SuratMarunEvent,
    dressCode: SuratMarunDressCode,
    galeri: SuratMarunGallery,
    loveStory: SuratMarunLoveStory,
    liveStream: SuratMarunLiveStream,
    amplop: SuratMarunGift,
    ucapan: SuratMarunWishes,
    penutup: SuratMarunClosing,
  },
};

export default function SuratMarunTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
