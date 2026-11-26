// FILE DIBUAT OTOMATIS oleh scripts/themes-sync.ts — jangan diedit manual.
import type { ThemeManifest } from "./types";
import { manifest as lili } from "./lili/manifest";
import { manifest as pitaKrayon } from "./pita-krayon/manifest";
import { manifest as rendaRimba } from "./renda-rimba/manifest";
import { manifest as suratMarun } from "./surat-marun/manifest";
import { manifest as tiraiBeludru } from "./tirai-beludru/manifest";

export const THEME_MANIFESTS: readonly ThemeManifest[] = [lili, pitaKrayon, rendaRimba, suratMarun, tiraiBeludru];

export type ThemeId = "lili" | "pita-krayon" | "renda-rimba" | "surat-marun" | "tirai-beludru";

/** Thumbnail screenshot cover (pnpm themes:thumbs); tema tanpa file memakai gradien manifest. */
export const THEME_THUMBS: Record<string, string> = {
  "lili": "/theme-thumbs/lili.webp?v=mwxx9kbb",
  "pita-krayon": "/theme-thumbs/pita-krayon.webp?v=mwxx8jxr",
  "renda-rimba": "/theme-thumbs/renda-rimba.webp?v=mwxx9ax3",
  "surat-marun": "/theme-thumbs/surat-marun.webp?v=mwxx8ovx",
  "tirai-beludru": "/theme-thumbs/tirai-beludru.webp?v=mwxx9mij",
};
