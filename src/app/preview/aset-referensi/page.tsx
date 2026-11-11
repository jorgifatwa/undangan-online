import fs from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetBrowser, type AssetRow } from "./AssetBrowser";

export const metadata: Metadata = { title: "Aset Referensi", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Status per id dari kolom Status di ASSET-AUDIT.md (diisi pemilik). */
async function readStatuses(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const text = await fs.readFile(path.join(process.cwd(), "src/themes/ASSET-AUDIT.md"), "utf8");
    for (const line of text.split("\n")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const id = cells[0]?.replace(/`/g, "");
      if (/^(tb|rr)-/.test(id ?? "")) out[id] = cells[8] ?? "belum dicek";
    }
  } catch {
    /* file belum ada */
  }
  return out;
}

/**
 * Daftar semua gambar dari folder referensi kedua tema (HANYA development).
 * Data & gambar dibuat oleh `pnpm ref:assets` ke .reference/ & public/_ref/
 * (keduanya gitignored).
 */
export default async function AsetReferensiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  let assets: AssetRow[] = [];
  let generatedAt: string | null = null;
  try {
    const raw = JSON.parse(
      await fs.readFile(path.join(process.cwd(), ".reference/assets.json"), "utf8"),
    );
    assets = raw.assets;
    generatedAt = raw.generatedAt;
  } catch {
    /* belum dijalankan */
  }
  const statuses = await readStatuses();

  if (assets.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl">Belum ada data aset referensi</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Jalankan <code className="rounded bg-neutral-100 px-1.5 py-0.5">pnpm ref:assets</code>{" "}
          untuk memindai folder referensi dan memotret posisi aset dari situs live.
        </p>
      </main>
    );
  }

  return (
    <AssetBrowser
      assets={assets.map((a) => ({ ...a, status: statuses[a.id] ?? "belum dicek" }))}
      generatedAt={generatedAt}
    />
  );
}
