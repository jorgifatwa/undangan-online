import { THEME_MANIFESTS } from "@/themes/registry";
import { CATEGORY_LABELS } from "@/themes/types";

import { PhoneThumb } from "./PhoneThumb";

/** Strip bergulir berisi sampul semua tema (diulang agar mulus). */
export function ThemeMarquee() {
  const ordered = [...THEME_MANIFESTS].sort(
    (a, b) => Number(b.id === "tirai-beludru") - Number(a.id === "tirai-beludru"),
  );
  const items = [...ordered, ...ordered, ...ordered];
  return (
    <section aria-label="Contoh tema" className="marquee overflow-hidden py-14 sm:py-20">
      <div className="marquee-track gap-6 pr-6">
        {[...items, ...items].map((t, i) => (
          <figure
            key={`${t.id}-${i}`}
            className="w-[150px] shrink-0 sm:w-[170px]"
            aria-hidden={i >= items.length}
          >
            <PhoneThumb theme={t} sizes="170px" />
            <figcaption className="mt-3 text-center text-xs">
              <span className="font-medium">{t.name}</span>
              <span className="text-muted-foreground"> · {CATEGORY_LABELS[t.category]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
