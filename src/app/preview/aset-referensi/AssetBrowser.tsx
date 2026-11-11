"use client";

import { useMemo, useState } from "react";

export interface AssetRow {
  id: string;
  theme: "tirai-beludru" | "renda-rimba";
  file: string;
  base: string;
  kind: "image" | "lottie";
  bytes: number;
  width?: number;
  height?: number;
  thumb?: string;
  slot: string | null;
  svg: string;
  role: string;
  codeRefs: string[];
  usages: { page: string; section: string; position?: string }[];
  sharedWith: string[];
  status: string;
}

const THEMES = { "tirai-beludru": "Tirai Beludru", "renda-rimba": "Renda Rimba" } as const;

const STATUS_STYLE: Record<string, string> = {
  "belum dicek": "bg-neutral-200 text-neutral-700",
  free: "bg-emerald-100 text-emerald-800",
  milik: "bg-sky-100 text-sky-800",
  pro: "bg-rose-100 text-rose-800",
};

const kb = (n: number) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export function AssetBrowser({
  assets,
  generatedAt,
}: {
  assets: AssetRow[];
  generatedAt: string | null;
}) {
  const [theme, setTheme] = useState<"all" | AssetRow["theme"]>("all");
  const [onlySlots, setOnlySlots] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState<{ src: string; caption: string } | null>(null);

  const list = useMemo(
    () =>
      assets.filter(
        (a) =>
          (theme === "all" || a.theme === theme) &&
          (!onlySlots || a.slot) &&
          (status === "all" || a.status === status) &&
          (!q ||
            `${a.id} ${a.file} ${a.role} ${a.slot ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [assets, theme, onlySlots, status, q],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of assets) if (a.slot) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [assets]);

  return (
    <div className="min-h-dvh bg-neutral-100 pb-24 font-sans text-neutral-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <h1 className="font-serif text-xl">Aset Referensi</h1>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="rounded border px-2 py-1"
          >
            <option value="all">Kedua tema</option>
            <option value="tirai-beludru">Tirai Beludru (Jorgi)</option>
            <option value="renda-rimba">Renda Rimba (Subagja)</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="all">Semua status</option>
            {["belum dicek", "free", "pro", "milik"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={onlySlots}
              onChange={(e) => setOnlySlots(e.target.checked)}
            />
            Hanya ornamen (punya slot)
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari id / file / peran…"
            className="min-w-48 flex-1 rounded border px-2 py-1"
          />
          <span className="text-xs text-neutral-500">
            {list.length} dari {assets.length} file · ornamen:{" "}
            {Object.entries(counts)
              .map(([k, v]) => `${k} ${v}`)
              .join(" · ")}
            {generatedAt && ` · dipindai ${new Date(generatedAt).toLocaleString("id-ID")}`}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6">
        <p className="mb-5 max-w-3xl text-sm text-neutral-600">
          Isi status di <code className="rounded bg-white px-1">src/themes/ASSET-AUDIT.md</code>{" "}
          (free / pro / milik), lalu jalankan{" "}
          <code className="rounded bg-white px-1">pnpm assets:sync</code>. Klik screenshot posisi
          untuk memperbesar — kotak merah = lokasi aset di section referensi.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col overflow-hidden rounded-xl border bg-white">
              <div className="flex gap-3 p-3">
                <div
                  className="grid h-36 w-32 shrink-0 place-items-center overflow-hidden rounded-lg border"
                  style={{
                    background:
                      "repeating-conic-gradient(#e5e5e5 0 25%, #fafafa 0 50%) 0 0 / 14px 14px",
                  }}
                >
                  {a.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumb}
                      alt={a.file}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-neutral-500">
                      {a.kind === "lottie" ? "Animasi Lottie" : "tanpa pratinjau"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <code className="font-semibold">{a.id}</code>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[a.status] ?? STATUS_STYLE["belum dicek"]}`}
                    >
                      {a.status}
                    </span>
                    {a.sharedWith.length > 0 && (
                      <span
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                        title={a.sharedWith.join(", ")}
                      >
                        dipakai di kedua tema
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-neutral-500">{THEMES[a.theme]}</p>
                  <p className="mt-1 font-medium text-neutral-900">{a.role}</p>
                  <p className="mt-1 break-all text-neutral-500">{a.file}</p>
                  <p className="mt-1 text-neutral-500">
                    {a.width ? `${a.width}×${a.height} · ` : ""}
                    {kb(a.bytes)}
                  </p>
                  <p className="mt-1.5">
                    Slot:{" "}
                    {a.slot ? <code className="rounded bg-neutral-100 px-1">{a.slot}</code> : "—"}
                  </p>
                  <p className="mt-0.5 text-neutral-500">Pengganti SVG: {a.svg}</p>
                </div>
              </div>
              <div className="mt-auto border-t bg-neutral-50 p-3">
                {a.usages.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    {a.kind === "lottie"
                      ? "Animasi Lottie — tidak terdeteksi sebagai gambar di halaman."
                      : a.codeRefs.length
                        ? `Tidak tampil di halaman (disembunyikan / hanya di kode: ${a.codeRefs.slice(0, 2).join(", ")}).`
                        : "Tidak dipakai di halaman undangan."}
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto">
                    {a.usages.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        className="shrink-0 text-left"
                        onClick={() =>
                          u.position &&
                          setZoom({
                            src: u.position,
                            caption: `${a.id} — ${u.section} (${u.page === "cover" ? "cover" : "isi undangan"})`,
                          })
                        }
                      >
                        {u.position && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.position}
                            alt={`Posisi di ${u.section}`}
                            className="h-28 w-auto rounded border"
                            loading="lazy"
                          />
                        )}
                        <span className="mt-1 block max-w-28 truncate text-[11px] text-neutral-600">
                          {u.section}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom.src}
            alt={zoom.caption}
            className="max-h-[85dvh] w-auto rounded-lg bg-white"
          />
          <p className="mt-3 text-sm text-white">{zoom.caption}</p>
        </div>
      )}
    </div>
  );
}
