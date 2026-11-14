"use client";

import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface PriceCard {
  tier: string;
  label: string;
  /** null = belum dijual untuk jenis acara ini. */
  price: string | null;
  note: string;
  popular: boolean;
  rows: { label: string; value: string | boolean; soon?: boolean; valueOnly?: boolean }[];
  cta: string;
}

/**
 * Kartu harga dengan tab Pernikahan / Ulang tahun. Data disiapkan server dari
 * lib/packages.ts (lihat pricingData) — komponen ini hanya menampilkan.
 */
export function Pricing({
  wedding,
  birthday,
  compact = false,
}: {
  wedding: PriceCard[];
  birthday: PriceCard[];
  /** true = baris fitur diringkas (landing); /harga menampilkan tabel lengkap terpisah. */
  compact?: boolean;
}) {
  const [tab, setTab] = useState<"wedding" | "birthday">("wedding");
  const cards = tab === "wedding" ? wedding : birthday;
  return (
    <div>
      <div
        role="tablist"
        aria-label="Jenis acara"
        className="bg-sand mx-auto flex w-fit rounded-full border p-1 text-sm"
      >
        {(
          [
            ["wedding", "Pernikahan"],
            ["birthday", "Ulang tahun"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full px-5 py-2 font-medium transition-colors",
              tab === k ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="tabpanel">
        {cards.map((c) => (
          <section
            key={c.tier}
            data-tier={c.tier}
            className={cn(
              "bg-card relative flex flex-col rounded-3xl border p-6",
              c.popular &&
                "border-primary shadow-[0_20px_50px_-25px_rgb(120_50_25/0.45)] lg:-translate-y-2",
              !c.price && "opacity-70",
            )}
          >
            {c.popular && (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-medium">
                Paling populer
              </span>
            )}
            <h3 className="font-heading text-2xl">{c.label}</h3>
            <p className="mt-3">
              {c.price ? (
                <span className="font-heading text-3xl">{c.price}</span>
              ) : (
                <span className="text-muted-foreground font-medium">Segera hadir</span>
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{c.note}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {(compact ? c.rows.filter((r) => r.value !== false && !r.soon) : c.rows).map((r) => (
                <li key={r.label} className="flex gap-2">
                  {r.value === false ? (
                    <Minus
                      className="text-muted-foreground/60 mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                  ) : (
                    <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                  )}
                  <span className={cn(r.value === false && "text-muted-foreground/70")}>
                    {typeof r.value === "string"
                      ? r.valueOnly
                        ? r.value
                        : `${r.label}: ${r.value}`
                      : r.label}
                    {r.soon && r.value !== false && (
                      <span className="bg-accent text-accent-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                        Segera hadir
                      </span>
                    )}
                    {r.value === false && <span className="sr-only"> (tidak termasuk)</span>}
                  </span>
                </li>
              ))}
            </ul>
            {c.price ? (
              <Link
                href="/masuk"
                className={cn(
                  "mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-transform hover:-translate-y-px",
                  c.popular
                    ? "bg-primary text-primary-foreground"
                    : "border-foreground/15 hover:bg-sand border",
                )}
              >
                {c.cta}
              </Link>
            ) : (
              <span className="text-muted-foreground mt-6 rounded-full border border-dashed px-4 py-2.5 text-center text-sm">
                Belum tersedia
              </span>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
