"use client";

import { useState } from "react";

export interface Shot {
  index: number;
  key: string;
  label: string;
  file: string;
  width: number;
  height: number;
  /** Section tema padanannya; null = cover. */
  section: string | null;
}
export interface FontRow {
  original: string;
  replacement: string;
  family: string;
  file: string;
  kb: number | null;
  sample: string;
  size: number;
  usage: string;
  /** [index screenshot, x, y, w, h] pada lebar 430. */
  crop?: [number, number, number, number, number];
}
export interface ThemeShots {
  theme: string;
  label: string;
  shots: Shot[];
  fonts: FontRow[];
}

type Mode = "dampingan" | "tumpuk" | "font";
const W = 430;

function frameSrc(theme: string, section: string | null, k: number) {
  const p = new URLSearchParams({ bare: "1", ref: "1", k: String(k) });
  if (section) {
    p.set("open", "1");
    p.set("focus", section);
  }
  return `/preview/${theme}?${p.toString()}`;
}

function ThemeFrame({
  theme,
  shot,
  k,
  style,
}: {
  theme: string;
  shot: Shot;
  k: number;
  style?: React.CSSProperties;
}) {
  return (
    <iframe
      key={k}
      title={`${theme} — ${shot.label}`}
      src={frameSrc(theme, shot.section, k)}
      loading="lazy"
      width={W}
      height={shot.height}
      style={{
        display: "block",
        width: W,
        height: shot.height,
        border: 0,
        background: "#111",
        ...style,
      }}
    />
  );
}

export function Banding({ themes }: { themes: ThemeShots[] }) {
  const [themeId, setThemeId] = useState(themes[0].theme);
  const [mode, setMode] = useState<Mode>("dampingan");
  const [opacity, setOpacity] = useState(50);
  const [diff, setDiff] = useState(false);
  const [k, setK] = useState(0);
  const t = themes.find((x) => x.theme === themeId) ?? themes[0];

  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:bg-neutral-100"}`;

  return (
    <main className="min-h-dvh bg-neutral-100 pb-20 font-sans text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-2">
          <h1 className="mr-2 font-semibold">Banding referensi</h1>
          {themes.map((x) => (
            <button
              key={x.theme}
              type="button"
              className={tab(x.theme === themeId)}
              onClick={() => setThemeId(x.theme)}
            >
              {x.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-neutral-300" />
          {(
            [
              ["dampingan", "Berdampingan"],
              ["tumpuk", "Tumpuk"],
              ["font", "Font"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" className={tab(mode === m)} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
          {mode !== "font" && (
            <button
              type="button"
              className={tab(false)}
              onClick={() => setK((n) => n + 1)}
              title="Muat ulang semua iframe (animasi masuk diputar lagi)"
            >
              ↻ Muat ulang
            </button>
          )}
        </div>
        {mode === "tumpuk" && (
          <div className="mx-auto mt-3 flex max-w-[960px] flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              Referensi
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-56"
                aria-label="Transparansi tema di atas referensi"
              />
              Tema <span className="w-10 text-neutral-500 tabular-nums">{opacity}%</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={diff} onChange={(e) => setDiff(e.target.checked)} />
              Mode selisih (difference) — area hitam = sama persis
            </label>
          </div>
        )}
      </header>

      {mode === "font" ? (
        <section className="mx-auto mt-6 max-w-[960px] px-4">
          <p className="mb-4 text-sm text-neutral-600">
            Font asli desain tidak dimuat (file ekspor Canva/berlisensi tidak dipakai). Kiri:
            potongan screenshot referensi; kanan: font OFL pengganti dengan teks yang sama. Ukuran =
            file subset hasil <code className="rounded bg-neutral-200 px-1">pnpm fonts:build</code>.
          </p>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {t.fonts.map((f) => {
              const shot = f.crop ? t.shots.find((s) => s.index === f.crop![0]) : undefined;
              return (
                <div
                  key={f.original + f.file}
                  className="grid gap-4 border-b border-neutral-100 p-4 last:border-0 md:grid-cols-[220px_1fr_1fr]"
                >
                  <div className="text-sm">
                    <p className="font-semibold">{f.original}</p>
                    <p className="text-neutral-500">→ {f.replacement}</p>
                    <p className="mt-1 text-xs text-neutral-500">{f.usage}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {f.file} · {f.kb === null ? "belum dibuat" : `${f.kb} KB`}
                    </p>
                  </div>
                  <div className="flex min-h-16 items-center justify-center rounded-lg bg-neutral-900">
                    {shot && f.crop ? (
                      <div
                        role="img"
                        aria-label={`Referensi: ${f.original}`}
                        style={{
                          width: f.crop[3],
                          height: f.crop[4],
                          maxWidth: "100%",
                          backgroundImage: `url(${shot.file})`,
                          backgroundPosition: `-${f.crop[1]}px -${f.crop[2]}px`,
                          backgroundSize: `${W}px auto`,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">tidak ada potongan referensi</span>
                    )}
                  </div>
                  <div
                    className="flex min-h-16 items-center justify-center rounded-lg bg-neutral-900 px-3 text-center text-white"
                    dir="auto"
                  >
                    <span
                      style={{
                        fontFamily: f.family,
                        fontSize: f.size,
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.sample}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="mx-auto mt-6 flex max-w-[960px] flex-col gap-10 px-4">
          {t.shots.map((s) => (
            <section key={s.key}>
              <h2 className="mb-2 text-sm font-medium">
                {s.index}. {s.label}{" "}
                <span className="text-neutral-500">
                  → {s.section ? `section "${s.section}"` : "cover"} · {s.height}px
                </span>
              </h2>
              {mode === "dampingan" ? (
                <div className="flex flex-wrap gap-4">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element -- piksel asli screenshot, tanpa optimasi */}
                    <img
                      src={s.file}
                      alt={`Referensi: ${s.label}`}
                      width={W}
                      height={s.height}
                      style={{ display: "block", width: W, height: s.height }}
                    />
                    <figcaption className="mt-1 text-xs text-neutral-500">
                      Referensi (situs live)
                    </figcaption>
                  </figure>
                  <figure>
                    <ThemeFrame theme={t.theme} shot={s} k={k} />
                    <figcaption className="mt-1 text-xs text-neutral-500">
                      Tema hasil adaptasi (data contoh)
                    </figcaption>
                  </figure>
                </div>
              ) : (
                <div
                  className="relative"
                  style={{ width: W, height: s.height, background: "#000" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- piksel asli screenshot, tanpa optimasi */}
                  <img
                    src={s.file}
                    alt={`Referensi: ${s.label}`}
                    width={W}
                    height={s.height}
                    style={{ position: "absolute", inset: 0, width: W, height: s.height }}
                  />
                  <ThemeFrame
                    theme={t.theme}
                    shot={s}
                    k={k}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: diff ? 1 : opacity / 100,
                      mixBlendMode: diff ? "difference" : "normal",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
