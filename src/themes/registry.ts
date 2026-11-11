import type { SupportedEventType } from "@/schemas";

import { THEME_MANIFESTS } from "./registry.generated";
import type { ThemeCategory, ThemeManifest } from "./types";

export { THEME_MANIFESTS };

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
