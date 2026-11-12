// FILE DIBUAT OTOMATIS oleh scripts/themes-sync.ts — jangan diedit manual.
import type { ThemeManifest } from "./types";
import { manifest as confettiParty } from "./confetti-party/manifest";
import { manifest as rendaRimba } from "./renda-rimba/manifest";
import { manifest as tiraiBeludru } from "./tirai-beludru/manifest";

export const THEME_MANIFESTS: readonly ThemeManifest[] = [confettiParty, rendaRimba, tiraiBeludru];

export type ThemeId = "confetti-party" | "renda-rimba" | "tirai-beludru";

/** Thumbnail screenshot cover (pnpm themes:thumbs); tema tanpa file memakai gradien manifest. */
export const THEME_THUMBS: Record<string, string> = {
  "confetti-party": "/theme-thumbs/confetti-party.webp?v=mwdqa5wu",
  "renda-rimba": "/theme-thumbs/renda-rimba.webp?v=mwdqaso1",
  "tirai-beludru": "/theme-thumbs/tirai-beludru.webp?v=mwdqb1lv",
};
