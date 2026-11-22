"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import { SuratMarunCover } from "./sections/Cover";
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
  sections: {},
};

export default function SuratMarunTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
