"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeCard } from "@/components/themes/ThemeCard";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ThemeManifest } from "@/themes/types";

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "WEDDING", label: "Pernikahan" },
  { key: "BIRTHDAY", label: "Ulang tahun" },
] as const;

/**
 * Harga per tema (dari manifest), sekali bayar per undangan. Satu daftar
 * "yang termasuk" untuk semua tema — tidak ada paket/tingkatan.
 */
export function ThemePricing({
  themes,
  included,
}: {
  themes: ThemeManifest[];
  included: string[];
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const shown = themes
    .filter((t) => filter === "all" || (t.eventTypes as readonly string[]).includes(filter))
    .sort((a, b) => a.price - b.price);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <div
          role="tablist"
          aria-label="Jenis acara"
          className="bg-sand mx-auto flex w-fit rounded-full border p-1 text-sm lg:mx-0"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-5 py-2 font-medium transition-colors",
                filter === f.key ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
          {shown.map((t) => (
            <li key={t.id} className="group" data-theme-price-card={t.id}>
              <div className="mx-auto max-w-[220px]">
                <ThemeCard theme={t} showPrice={false} />
                <p className="mt-2 text-left">
                  <span className="font-heading text-2xl">{formatRupiah(t.price)}</span>
                </p>
                <p className="text-muted-foreground text-left text-xs">
                  Sekali bayar untuk satu undangan · coba gratis
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/masuk"
                    className="bg-primary text-primary-foreground flex-1 rounded-full px-3 py-2 text-center text-sm font-medium"
                  >
                    Coba gratis
                  </Link>
                  <Link
                    href={`/preview/${t.id}`}
                    className="border-foreground/15 hover:bg-sand rounded-full border px-3 py-2 text-center text-sm"
                  >
                    Lihat
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="bg-card h-fit rounded-3xl border p-6" aria-labelledby="termasuk">
        <h3 id="termasuk" className="font-heading text-2xl">
          Sudah termasuk di setiap tema
        </h3>
        <ul className="mt-4 space-y-2.5 text-sm">
          {included.map((i) => (
            <li key={i} className="flex gap-2">
              <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
