"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { TiraiAmbient } from "./Ambient";
import { THEME_ASSETS } from "./assets/index.generated";
import { TiraiProvider } from "./context";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { TiraiClosing } from "./sections/Closing";
import { TiraiCouple } from "./sections/Couple";
import { TiraiCover } from "./sections/Cover";
import { TiraiCountdown, TiraiEvent } from "./sections/Event";
import { TiraiDressCode, TiraiLiveStream, TiraiLoveStory } from "./sections/Extras";
import { TiraiGallery } from "./sections/Gallery";
import { TiraiGift } from "./sections/Gift";
import { TiraiIntro } from "./sections/Intro";
import { TiraiWishes } from "./sections/Wishes";
import "./theme.css";

/**
 * Tirai Beludru — adaptasi per piksel desain "Undangan Jorgi Estetik" milik
 * pemilik (koordinat kanvas 440 px asli), dengan aset asli berstatus "milik"
 * (lihat ASSET-AUDIT.md) dan cadangan SVG orisinal bila aset tidak tersedia.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  Cover: TiraiCover,
  Ambient: TiraiAmbient,
  sections: {
    ayat: TiraiIntro,
    profil: TiraiCouple,
    acara: TiraiEvent,
    hitungMundur: TiraiCountdown,
    amplop: TiraiGift,
    ucapan: TiraiWishes,
    galeri: TiraiGallery,
    penutup: TiraiClosing,
    loveStory: TiraiLoveStory,
    dressCode: TiraiDressCode,
    liveStream: TiraiLiveStream,
  },
};

export default function TiraiBeludruTheme(props: ThemeProps) {
  return (
    <TiraiProvider>
      <ThemeRoot theme={definition} {...props} />
    </TiraiProvider>
  );
}
