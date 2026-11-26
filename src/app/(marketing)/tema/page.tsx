import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ThemeCard } from "@/components/themes/ThemeCard";
import { listThemes, usedCategories } from "@/themes/registry";
import { CATEGORY_LABELS, type ThemeCategory } from "@/themes/types";

export const metadata: Metadata = {
  title: "Tema Undangan Pernikahan & Ulang Tahun",
  description:
    "Jelajahi tema undangan digital pernikahan dan ulang tahun online. Semua tema bisa dicoba gratis.",
  alternates: { canonical: "/tema" },
};

const EVENT_FILTERS = [
  { key: "", label: "Semua" },
  { key: "wedding", label: "Pernikahan", type: "WEDDING" as const },
  { key: "ultah", label: "Ulang Tahun", type: "BIRTHDAY" as const },
];

function href(acara: string, kategori: string) {
  const p = new URLSearchParams();
  if (acara) p.set("acara", acara);
  if (kategori) p.set("kategori", kategori);
  const s = p.toString();
  return s ? `/tema?${s}` : "/tema";
}

export default async function TemaPage({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; kategori?: string }>;
}) {
  const { acara = "", kategori = "" } = await searchParams;
  const eventType = EVENT_FILTERS.find((f) => f.key === acara)?.type;
  const categories = usedCategories();
  const category = categories.includes(kategori as ThemeCategory)
    ? (kategori as ThemeCategory)
    : undefined;
  const themes = listThemes({ eventType, category });

  const chip = (active: boolean, href: string, label: string) => (
    <Button
      key={href}
      asChild
      size="sm"
      variant={active ? "default" : "outline"}
      className={active ? "rounded-full px-4" : "rounded-full bg-transparent px-4"}
    >
      <Link href={href}>{label}</Link>
    </Button>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">Tema</p>
      <h1 className="font-heading mt-3 text-4xl sm:text-5xl">Pilih tema undanganmu</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Semua tema bisa dicoba gratis. Suka? Tekan &ldquo;Pesan tema ini&rdquo;, isi undanganmu,
        lalu bayar sekali.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {EVENT_FILTERS.map((f) => chip(acara === f.key, href(f.key, kategori), f.label))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chip(!category, href(acara, ""), "Semua gaya")}
        {categories.map((c) => chip(category === c, href(acara, c), CATEGORY_LABELS[c]))}
      </div>

      {themes.length === 0 ? (
        <p className="text-muted-foreground mt-16 text-center">Belum ada tema untuk filter ini.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map((t) => (
            <li key={t.id} className="group">
              <Link href={`/preview/${t.id}`} className="block">
                <ThemeCard theme={t} />
              </Link>
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
