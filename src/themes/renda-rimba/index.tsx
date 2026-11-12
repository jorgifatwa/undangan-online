"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { RendaAmbient } from "./Ambient";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { RendaClosing } from "./sections/Closing";
import { RendaCouple } from "./sections/Couple";
import { RendaCover } from "./sections/Cover";
import { RendaEvent } from "./sections/Event";
import { RendaDressCode, RendaLiveStream, RendaLoveStory } from "./sections/Extras";
import { RendaGallery } from "./sections/Gallery";
import { RendaGift } from "./sections/Gift";
import { RendaIntro } from "./sections/Intro";
import { RendaSaveDate } from "./sections/SaveDate";
import { RendaWishes } from "./sections/Wishes";
import "./theme.css";

/**
 * Renda Rimba — adaptasi desain "Undangan Subagja" milik pemilik (kanvas
 * 430 px asli), dengan aset asli berstatus "milik" (lihat ASSET-AUDIT.md) dan
 * cadangan SVG orisinal bila aset tidak tersedia.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  Cover: RendaCover,
  Ambient: RendaAmbient,
  prepareBehindCover: true,
  sections: {
    ayat: RendaIntro,
    hitungMundur: RendaSaveDate,
    profil: RendaCouple,
    acara: RendaEvent,
    loveStory: RendaLoveStory,
    dressCode: RendaDressCode,
    liveStream: RendaLiveStream,
    galeri: RendaGallery,
    amplop: RendaGift,
    ucapan: RendaWishes,
    penutup: RendaClosing,
  },
};

export default function RendaRimbaTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
