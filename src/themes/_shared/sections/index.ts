import type { ComponentType } from "react";

import type { SectionId } from "@/schemas/sections";

import { DefaultPenutup } from "./Closing";
import {
  DefaultAcara,
  DefaultDressCode,
  DefaultHitungMundur,
  DefaultLiveStream,
  DefaultMaps,
} from "./Event";
import { DefaultGaleri } from "./Gallery";
import { DefaultAmplop } from "./Gift";
import { DefaultRsvp, DefaultUcapan } from "./Interactive";
import { DefaultAyat, DefaultLoveStory, DefaultProfil, DefaultSalam } from "./Intro";

export { DefaultCover, GuestGreeting, useInvitationTitle } from "./Cover";
export { CalendarButton, CountdownBoxes } from "./Event";
export { Lightbox } from "./Gallery";
export { FillPhoto, Icon, SectionTitle, Divider } from "./ui";

/** Section default; tema meng-override lewat ThemeDefinition.sections. Cover ditangani terpisah. */
export const DEFAULT_SECTIONS: Record<Exclude<SectionId, "cover">, ComponentType> = {
  salam: DefaultSalam,
  ayat: DefaultAyat,
  profil: DefaultProfil,
  loveStory: DefaultLoveStory,
  acara: DefaultAcara,
  hitungMundur: DefaultHitungMundur,
  maps: DefaultMaps,
  dressCode: DefaultDressCode,
  liveStream: DefaultLiveStream,
  galeri: DefaultGaleri,
  rsvp: DefaultRsvp,
  ucapan: DefaultUcapan,
  amplop: DefaultAmplop,
  penutup: DefaultPenutup,
};
