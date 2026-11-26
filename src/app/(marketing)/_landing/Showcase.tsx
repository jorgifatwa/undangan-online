"use client";

import Link from "next/link";
import { useState } from "react";

import { ThemeCard } from "@/components/themes/ThemeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ThemeManifest } from "@/themes/types";

export const THEME_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "WEDDING", label: "Pernikahan" },
  { key: "BIRTHDAY", label: "Ulang tahun" },
] as const;
export type ThemeFilter = (typeof THEME_FILTERS)[number]["key"];

/** Filter jenis acara (shadcn Tabs). */
export function ThemeFilterTabs({
  value,
  onChange,
  className,
}: {
  value: ThemeFilter;
  onChange: (v: ThemeFilter) => void;
  className?: string;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ThemeFilter)} className={className}>
      <TabsList aria-label="Filter tema" className="rounded-full">
        {THEME_FILTERS.map((f) => (
          <TabsTrigger key={f.key} value={f.key} className="rounded-full px-4">
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** Kartu tema + filter jenis acara. "Coba tema" → /preview/{tema}. */
export function Showcase({ themes }: { themes: ThemeManifest[] }) {
  const [filter, setFilter] = useState<ThemeFilter>("all");
  const shown = themes.filter(
    (t) => filter === "all" || (t.eventTypes as readonly string[]).includes(filter),
  );
  return (
    <div>
      <ThemeFilterTabs value={filter} onChange={setFilter} className="items-center" />
      <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-10 sm:gap-x-10">
        {shown.map((t) => (
          <li key={t.id} className="group w-[calc(50%-0.5rem)] sm:w-[220px]" data-theme-card={t.id}>
            <div className="mx-auto max-w-[220px]">
              <ThemeCard theme={t} />
              <Button asChild variant="outline" className="mt-4 w-full rounded-full bg-transparent">
                <Link href={`/preview/${t.id}`}>Coba tema ini</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
