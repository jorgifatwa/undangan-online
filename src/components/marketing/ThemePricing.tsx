"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeFilterTabs, type ThemeFilter } from "@/app/(marketing)/_landing/Showcase";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import type { ThemeManifest } from "@/themes/types";

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
  const [filter, setFilter] = useState<ThemeFilter>("all");
  const shown = themes
    .filter((t) => filter === "all" || (t.eventTypes as readonly string[]).includes(filter))
    .sort((a, b) => a.price - b.price);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <ThemeFilterTabs
          value={filter}
          onChange={setFilter}
          className="items-center lg:items-start"
        />
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
          {shown.map((t) => (
            <li key={t.id} className="group" data-theme-price-card={t.id}>
              <div className="mx-auto max-w-[220px]">
                <ThemeCard theme={t} showPrice={false} />
                <p className="font-heading mt-2 text-2xl">{formatRupiah(t.price)}</p>
                <p className="text-muted-foreground text-xs">Sekali bayar untuk satu undangan</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" className="h-9 flex-1 rounded-full">
                    <Link
                      href={`/pesan/${t.id}${t.eventTypes.includes("WEDDING") ? "" : "?acara=ultah"}`}
                    >
                      Pesan
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full bg-transparent"
                  >
                    <Link href={`/preview/${t.id}`}>Coba</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Card className="h-fit rounded-3xl shadow-none" aria-labelledby="termasuk">
        <CardHeader>
          <CardTitle id="termasuk" className="font-heading text-2xl font-normal">
            Sudah termasuk di setiap tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-sm">
            {included.map((i) => (
              <li key={i} className="flex gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
