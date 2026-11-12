import Image from "next/image";

import { PACKAGES } from "@/lib/packages";
import { cn } from "@/lib/utils";
import { themeThumb } from "@/themes/registry";
import { CATEGORY_LABELS, type ThemeManifest } from "@/themes/types";

/**
 * Kartu tema (bingkai HP + thumbnail screenshot + info). Dipakai galeri /tema,
 * wizard pembuatan undangan, dan pemilih tema di editor. Murni tampilan —
 * pembungkus (Link / button) disediakan pemanggil.
 */
export function ThemeCard({
  theme,
  selected = false,
  showPackage = true,
}: {
  theme: ThemeManifest;
  selected?: boolean;
  showPackage?: boolean;
}) {
  const thumb = themeThumb(theme.id);
  return (
    <>
      <div
        className={cn(
          "relative mx-auto aspect-[9/16] overflow-hidden rounded-[1.75rem] border-[6px] shadow-lg transition-transform duration-300 group-hover:-translate-y-1",
          selected ? "border-primary ring-primary/30 ring-4" : "border-neutral-900",
        )}
        style={{ background: theme.thumbnail.background, color: theme.thumbnail.foreground }}
      >
        {thumb ? (
          <Image
            src={thumb}
            alt={`Cover tema ${theme.name}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 45vw, 240px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase opacity-80">
              {theme.eventTypes.includes("WEDDING") ? "The Wedding of" : "Birthday Party"}
            </p>
            <p className="font-heading mt-2 text-2xl leading-tight">{theme.name}</p>
          </div>
        )}
        {selected && (
          <span className="bg-primary text-primary-foreground absolute top-3 right-3 grid size-7 place-items-center rounded-full text-sm shadow">
            ✓
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2 text-left">
        <div>
          <p className="font-medium">{theme.name}</p>
          <p className="text-muted-foreground text-xs">
            {CATEGORY_LABELS[theme.category]} ·{" "}
            {theme.eventTypes
              .map((e) => (e === "WEDDING" ? "Pernikahan" : "Ulang tahun"))
              .join(", ")}
          </p>
        </div>
        <span className="flex shrink-0 -space-x-1.5 pt-1">
          {theme.variants.map((v) => (
            <span
              key={v.id}
              title={v.name}
              className="size-4 rounded-full border-2 border-white"
              style={{ background: v.swatch[0] }}
            />
          ))}
        </span>
      </div>
      {showPackage && (
        <p className="text-muted-foreground mt-1 text-left text-xs">
          Coba gratis · aktif permanen mulai paket{" "}
          {PACKAGES[theme.minPackage === "FREE" ? "BASIC" : theme.minPackage].label}
        </p>
      )}
    </>
  );
}
