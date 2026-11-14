"use client";

import Link from "next/link";
import { useState } from "react";

import { ThemeCard } from "@/components/themes/ThemeCard";
import { cn } from "@/lib/utils";
import type { ThemeManifest } from "@/themes/types";

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "WEDDING", label: "Pernikahan" },
  { key: "BIRTHDAY", label: "Ulang tahun" },
] as const;

/** Kartu tema + filter jenis acara. "Coba tema ini" → /preview/{tema}. */
export function Showcase({ themes }: { themes: ThemeManifest[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const shown = themes.filter(
    (t) => filter === "all" || (t.eventTypes as readonly string[]).includes(filter),
  );
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter tema">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              filter === f.key
                ? "bg-foreground text-background border-foreground"
                : "hover:bg-sand",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-10 sm:gap-x-10">
        {shown.map((t) => (
          <li key={t.id} className="group w-[calc(50%-0.5rem)] sm:w-[220px]" data-theme-card={t.id}>
            <div className="mx-auto max-w-[220px]">
              <ThemeCard theme={t} />
              <Link
                href={`/preview/${t.id}`}
                className="border-foreground/15 hover:bg-sand mt-4 block rounded-full border px-4 py-2 text-center text-sm font-medium"
              >
                Coba tema ini
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
