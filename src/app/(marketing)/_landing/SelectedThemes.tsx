import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type ThemeManifest } from "@/themes/types";

import { PhoneThumb } from "./PhoneThumb";

/**
 * Tema pilihan ala portofolio: panel besar berwarna tema berisi HP, label gaya,
 * nama, harga, dan tombol Coba / Pesan. Tema pertama tampil lebar.
 */
export function SelectedThemes({ themes }: { themes: ThemeManifest[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {themes.map((t, i) => (
        <article
          key={t.id}
          className={cn("group", i === 0 && "md:col-span-2")}
          data-reveal
          data-theme-card={t.id}
        >
          <Link
            href={`/preview/${t.id}`}
            className="relative flex h-[380px] items-end justify-center overflow-hidden rounded-[28px] sm:h-[440px]"
            style={{ background: t.thumbnail.background }}
            aria-label={`Coba tema ${t.name}`}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(80% 60% at 50% 30%, ${t.thumbnail.foreground}33, transparent 70%)`,
              }}
            />
            <PhoneThumb
              theme={t}
              sizes="240px"
              className="relative mb-[-70px] w-[200px] transition-transform duration-500 group-hover:-translate-y-3 sm:w-[230px]"
            />
            <span className="bg-background/90 absolute top-5 right-5 grid size-10 place-items-center rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100">
              <ArrowUpRight className="size-5" />
            </span>
          </Link>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <Badge variant="outline" className="text-muted-foreground font-normal">
                {CATEGORY_LABELS[t.category]} ·{" "}
                {t.eventTypes.includes("WEDDING") ? "Pernikahan" : "Ulang tahun"}
              </Badge>
              <h3 className="font-heading mt-2 flex items-center gap-2 text-2xl">
                {t.name}
                {t.id === "tirai-beludru" && (
                  <Badge className="bg-gold/15 text-foreground font-sans font-normal">
                    Tema andalan
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground text-sm">
                {formatRupiah(t.price)} · sekali bayar
              </p>
            </div>
            <div className="flex shrink-0 gap-2 pt-1">
              <Button asChild size="sm" variant="outline" className="rounded-full bg-transparent">
                <Link href={`/preview/${t.id}`}>Coba</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link
                  href={`/pesan/${t.id}${t.eventTypes.includes("WEDDING") ? "" : "?acara=ultah"}`}
                >
                  Pesan
                </Link>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
