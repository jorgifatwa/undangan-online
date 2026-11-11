"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { ConfettiAmbient } from "./Ambient";
import { ConfettiCover } from "./Cover";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import "./theme.css";

/**
 * Confetti Party — tema ulang tahun ceria, dibuat dari nol.
 * Hanya Cover & efek yang khusus; semua section lain memakai section default
 * (sekaligus menguji bahwa section default nyaman di-styling ulang lewat CSS).
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  Cover: ConfettiCover,
  Ambient: ConfettiAmbient,
};

export default function ConfettiPartyTheme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
