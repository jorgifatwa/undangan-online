// FILE DIBUAT OTOMATIS oleh scripts/themes-sync.ts — jangan diedit manual.
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { ThemeProps } from "./types";

/** Komponen tema dimuat lazy: JS, CSS, dan font tema lain tidak ikut terunduh. */
export const THEME_COMPONENTS: Record<string, ComponentType<ThemeProps>> = {
  "lili": dynamic(() => import("./lili")),
  "pita-krayon": dynamic(() => import("./pita-krayon")),
  "renda-rimba": dynamic(() => import("./renda-rimba")),
  "tirai-beludru": dynamic(() => import("./tirai-beludru")),
};
