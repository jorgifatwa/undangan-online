import Image from "next/image";

import { cn } from "@/lib/utils";
import { themeThumb } from "@/themes/registry";
import type { ThemeManifest } from "@/themes/types";

/** Bingkai HP berisi sampul tema (screenshot asli tema). Murni tampilan. */
export function PhoneThumb({
  theme,
  className,
  sizes = "220px",
  priority = false,
}: {
  theme: Pick<ThemeManifest, "id" | "name" | "thumbnail">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const thumb = themeThumb(theme.id);
  return (
    <div className={cn("phone", className)}>
      <div className="screen aspect-[9/19.5]" style={{ background: theme.thumbnail.background }}>
        {thumb && (
          <Image
            src={thumb}
            alt={`Sampul tema ${theme.name}`}
            fill
            sizes={sizes}
            unoptimized
            priority={priority}
            className="object-cover object-top"
          />
        )}
      </div>
    </div>
  );
}
