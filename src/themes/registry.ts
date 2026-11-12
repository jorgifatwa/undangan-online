import type { SupportedEventType } from "@/schemas";

import { THEME_MANIFESTS, THEME_THUMBS } from "./registry.generated";
import type { ThemeCategory, ThemeManifest } from "./types";

export { THEME_MANIFESTS };

/** URL screenshot cover tema (pnpm themes:thumbs), atau undefined. */
export function themeThumb(id: string): string | undefined {
  return THEME_THUMBS[id];
}

export function getManifest(id: string): ThemeManifest | undefined {
  return THEME_MANIFESTS.find((m) => m.id === id);
}

export function listThemes(
  filter: { eventType?: SupportedEventType; category?: ThemeCategory } = {},
) {
  return THEME_MANIFESTS.filter(
    (m) =>
      (!filter.eventType || m.eventTypes.includes(filter.eventType)) &&
      (!filter.category || m.category === filter.category),
  );
}

/** Kategori yang benar-benar dipakai tema (untuk chip filter). */
export function usedCategories(): ThemeCategory[] {
  return [...new Set(THEME_MANIFESTS.map((m) => m.category))];
}
