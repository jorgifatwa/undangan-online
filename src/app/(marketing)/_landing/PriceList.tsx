import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { CATEGORY_LABELS, type ThemeManifest } from "@/themes/types";

/**
 * Daftar harga ringkas untuk landing (galeri tema sudah tampil di "Tema
 * pilihan"): baris per tema + kartu "sudah termasuk".
 */
export function PriceList({ themes, included }: { themes: ThemeManifest[]; included: string[] }) {
  const rows = [...themes].sort((a, b) => a.price - b.price);
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <ul className="divide-y border-y" data-reveal>
        {rows.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-4 py-5">
            <span
              aria-hidden
              className="size-10 shrink-0 rounded-full border"
              style={{ background: t.thumbnail.background }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-2xl leading-tight">{t.name}</p>
              <p className="text-muted-foreground text-xs">
                {CATEGORY_LABELS[t.category]} ·{" "}
                {t.eventTypes.includes("WEDDING") ? "Pernikahan" : "Ulang tahun"}
              </p>
            </div>
            <p className="font-heading text-2xl tabular-nums">{formatRupiah(t.price)}</p>
            <Button asChild size="sm" className="rounded-full">
              <Link
                href={`/pesan/${t.id}${t.eventTypes.includes("WEDDING") ? "" : "?acara=ultah"}`}
              >
                Pesan
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <Card className="h-fit rounded-3xl shadow-none" data-reveal>
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-normal">
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
