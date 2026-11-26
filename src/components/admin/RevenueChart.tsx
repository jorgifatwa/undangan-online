"use client";

import { useState } from "react";

import { formatRupiah } from "@/lib/format";

/**
 * Grafik batang bertumpuk pendapatan per hari/minggu (website + marketplace).
 * SVG ringan tanpa pustaka: tooltip per batang (hover & fokus keyboard),
 * legenda, dan tabel data (kontras emas < 3:1 → tabel wajib tersedia).
 */
export interface ChartPoint {
  key: string;
  label: string;
  website: number;
  marketplace: number;
}

const SERIES = [
  { k: "website", label: "Website", color: "var(--chart-1)" },
  { k: "marketplace", label: "Marketplace", color: "var(--chart-2)" },
] as const;

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 56 };

function niceMax(v: number) {
  if (v <= 0) return 100_000;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}
const short = (n: number) =>
  n >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)} jt`
    : n >= 1000
      ? `${Math.round(n / 1000)} rb`
      : `${n}`;

export function RevenueChart({ data, bucket }: { data: ChartPoint[]; bucket: "hari" | "minggu" }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = niceMax(Math.max(...data.map((d) => d.website + d.marketplace), 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const slot = iw / Math.max(1, data.length);
  const bw = Math.max(2, Math.min(28, slot - 2)); // celah 2px antar batang
  const y = (v: number) => (v / max) * ih;
  const every = Math.ceil(data.length / 8);
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {SERIES.map((s) => (
          <span key={s.k} className="text-muted-foreground inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setTable((v) => !v)}
          className="text-muted-foreground hover:text-foreground ml-auto underline-offset-4 hover:underline"
        >
          {table ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>

      {table ? (
        <div className="max-h-72 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 sticky top-0 text-left text-xs">
              <tr>
                <th className="px-3 py-2 font-medium">
                  {bucket === "hari" ? "Tanggal" : "Minggu"}
                </th>
                <th className="px-3 py-2 text-right font-medium">Website</th>
                <th className="px-3 py-2 text-right font-medium">Marketplace</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((d) => (
                <tr key={d.key} className="border-t">
                  <td className="px-3 py-1.5">{d.label}</td>
                  <td className="px-3 py-1.5 text-right">{formatRupiah(d.website)}</td>
                  <td className="px-3 py-1.5 text-right">{formatRupiah(d.marketplace)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">
                    {formatRupiah(d.website + d.marketplace)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Grafik pendapatan per ${bucket}`}
          >
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={PAD.top + ih - f * ih}
                  y2={PAD.top + ih - f * ih}
                  stroke="var(--border)"
                  strokeDasharray={f === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 8}
                  y={PAD.top + ih - f * ih + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {short(max * f)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = PAD.left + i * slot + (slot - bw) / 2;
              const hw = y(d.website);
              const hm = y(d.marketplace);
              const gap = hw > 0 && hm > 0 ? 2 : 0;
              const base = PAD.top + ih;
              return (
                <g
                  key={d.key}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: website ${formatRupiah(d.website)}, marketplace ${formatRupiah(d.marketplace)}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                >
                  <rect
                    x={PAD.left + i * slot}
                    y={PAD.top}
                    width={slot}
                    height={ih}
                    fill="transparent"
                  />
                  {hw > 0 && (
                    <rect
                      x={x}
                      y={base - hw}
                      width={bw}
                      height={hw}
                      rx={Math.min(4, bw / 2)}
                      fill="var(--chart-1)"
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {hm > 0 && (
                    <rect
                      x={x}
                      y={base - hw - gap - hm}
                      width={bw}
                      height={hm}
                      rx={Math.min(4, bw / 2)}
                      fill="var(--chart-2)"
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {i % every === 0 && (
                    <text
                      x={PAD.left + i * slot + slot / 2}
                      y={H - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {bucket === "hari" ? d.label : d.label.split("–")[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {h && hover !== null && (
            <div
              className="bg-popover pointer-events-none absolute top-0 z-10 min-w-44 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-md"
              style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }}
            >
              <p className="text-muted-foreground mb-1">{h.label}</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatRupiah(h.website + h.marketplace)}
              </p>
              {SERIES.map((s) => (
                <p key={s.k} className="flex items-center gap-2 tabular-nums">
                  <span className="h-0.5 w-3 rounded" style={{ background: s.color }} />
                  <span className="font-medium">{formatRupiah(h[s.k])}</span>
                  <span className="text-muted-foreground">{s.label}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
