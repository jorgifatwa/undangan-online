"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { PitaKrayonCover } from "./sections/Cover";
import { PhotoStrips } from "./sections/Gallery";
import { Closing, DressCode, Gift, LiveStream } from "./sections/Extras";
import { Hero } from "./sections/Hero";
import { QuoteMusic } from "./sections/Music";
import { Profile } from "./sections/Profile";
import { SaveTheDate } from "./sections/Event";
import { Countdown, Story } from "./sections/Story";
import { WishCard } from "./sections/Wishes";
import "./theme.css";

/**
 * Pita Krayon — tema ulang tahun scrapbook coretan (lihat manifest.ts).
 * Isi undangan disiapkan di balik cover (prepareBehindCover); animasi masuk
 * section menunggu cover dibuka.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  Cover: PitaKrayonCover,
  prepareBehindCover: true,
  sections: {
    salam: Hero,
    ayat: QuoteMusic,
    profil: Profile,
    acara: SaveTheDate,
    dressCode: DressCode,
    liveStream: LiveStream,
    ucapan: WishCard,
    cerita: Story,
    hitungMundur: Countdown,
    galeri: PhotoStrips,
    amplop: Gift,
    penutup: Closing,
  },
};

export default function PitaKrayonTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
