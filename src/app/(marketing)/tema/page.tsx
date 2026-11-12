import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { listThemes, usedCategories } from "@/themes/registry";
import { CATEGORY_LABELS, type ThemeCategory } from "@/themes/types";

export const metadata: Metadata = {
  title: "Pilihan Tema",
  description:
    "Jelajahi tema undangan digital pernikahan dan ulang tahun. Semua tema bisa dicoba gratis.",
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

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <Link href="/" className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
        {siteConfig.name}
      </Link>
      <h1 className="font-heading mt-3 text-4xl sm:text-5xl">Pilih tema undanganmu</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Semua tema bisa dicoba gratis. Pilih paket hanya saat undangan ingin aktif permanen.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {EVENT_FILTERS.map((f) => (
          <Link key={f.key} href={href(f.key, kategori)} className={chip(acara === f.key)}>
            {f.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={href(acara, "")} className={chip(!category)}>
          Semua gaya
        </Link>
        {categories.map((c) => (
          <Link key={c} href={href(acara, c)} className={chip(category === c)}>
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {themes.length === 0 ? (
        <p className="text-muted-foreground mt-16 text-center">Belum ada tema untuk filter ini.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map((t) => (
            <li key={t.id}>
              <Link href={`/preview/${t.id}`} className="group block">
                <ThemeCard theme={t} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
