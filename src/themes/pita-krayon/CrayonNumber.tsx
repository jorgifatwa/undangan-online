import { useId } from "react";

/**
 * Angka umur bertekstur krayon (0–9), digambar ulang SEMUA sebagai SVG agar
 * goresannya seragam (keputusan pemilik; desain asli hanya punya "1" & "7").
 *
 * Tiap digit = satu garis tengah (viewBox 100×140) yang digores dua lapis:
 *  1. kontur krayon tebal → celah tipis warna kertas → isi
 *  2. garis arsiran terputus searah goresan (seperti celah putih krayon asli)
 *  3. tepi sedikit bergerigi (satu filter displacement statis).
 * Filter tidak dianimasikan; animasi masuk = sapuan transform di pembungkus
 * (theme.css .pk-crayon-reveal).
 */
const DIGITS: Record<string, { d: string; w: number }> = {
  "0": {
    d: "M50 16 C25 16 18 48 18 72 C18 100 28 124 50 124 C73 124 82 100 82 70 C82 42 74 16 50 16 Z",
    w: 100,
  },
  "1": { d: "M28 40 L56 16 L56 126 M34 126 L78 126", w: 92 },
  "2": { d: "M20 44 C22 24 38 14 54 16 C74 18 84 36 76 56 C68 76 40 98 18 124 L84 124", w: 100 },
  "3": {
    d: "M22 30 C34 14 70 12 76 36 C80 54 62 64 46 66 C70 66 86 82 82 102 C76 128 36 132 18 112",
    w: 100,
  },
  "4": { d: "M64 126 L64 16 L16 92 L88 92", w: 104 },
  "5": {
    d: "M80 18 L30 18 L24 64 C40 54 70 52 80 76 C90 104 66 128 42 126 C30 125 22 118 18 110",
    w: 100,
  },
  "6": {
    d: "M74 22 C56 12 30 20 22 52 C14 86 22 124 52 124 C76 126 86 106 82 88 C78 66 58 60 44 64 C32 68 22 78 22 90",
    w: 100,
  },
  "7": { d: "M16 20 L84 20 L40 128", w: 98 },
  "8": {
    d: "M50 66 C26 62 22 42 28 30 C36 14 66 14 72 30 C78 46 70 60 50 66 C24 72 16 92 24 108 C32 126 70 128 78 108 C86 90 74 70 50 66 Z",
    w: 100,
  },
  "9": {
    d: "M78 52 C78 30 66 16 48 16 C28 16 18 32 20 48 C22 64 36 72 52 70 C66 68 78 58 78 46 L74 96 C72 118 58 128 40 126 C30 125 22 118 20 110",
    w: 100,
  },
};

const OVERLAP = -6; // angka saling mendekat seperti "17" di desain
const SLIM = 0.8; // desain: angka ramping (lebar ≈ 0,55 × tinggi)

/** Sempitkan koordinat x path (semua perintah M/L/C/Z absolut, pasangan x y). */
function slim(d: string, k = SLIM, cx = 50) {
  let isX = true;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => {
    const v = Number(n);
    const out = isX ? (cx + (v - cx) * k).toFixed(1) : n;
    isX = !isX;
    return out;
  });
}

/** Garis arsir krayon: putus-putus tak beraturan, searah goresan. */
const STREAKS = [
  { dx: -6, dy: 1, dash: "22 7 38 5 14 9 30 6", w: 1.8 },
  { dx: -2.5, dy: -1, dash: "9 14 26 6 18 11", w: 1.1 },
  { dx: 2, dy: 2, dash: "34 6 18 10 26 4 40 8", w: 1.5 },
  { dx: 5.5, dy: -2, dash: "12 9 44 6 20 5", w: 1.3 },
];

export function CrayonNumber({
  value,
  height,
  className,
  style,
}: {
  value: number;
  /** tinggi tampil (CSS, mis. u(260)) */
  height: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const chars = String(Math.max(0, Math.floor(value))).split("");
  let x = 0;
  const placed = chars.map((c) => {
    const g = DIGITS[c] ?? DIGITS["0"];
    const w = g.w * SLIM;
    const at = x - (100 - w) / 2; // path berpusat di x=50
    x += w - OVERLAP;
    return { d: slim(g.d), at };
  });
  const width = x + OVERLAP;
  const stroke = (o: React.SVGProps<SVGPathElement>) => ({
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...o,
  });
  return (
    <svg
      viewBox={`-16 -16 ${width + 32} 172`}
      className={className}
      style={{ height, width: "auto", overflow: "visible", ...style }}
      role="img"
      aria-label={String(value)}
    >
      <defs>
        {/* tepi bergerigi halus seperti goresan krayon */}
        <filter id={`${id}-rough`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3.2" />
        </filter>
      </defs>
      <g>
        <g filter={`url(#${id}-rough)`}>
          {placed.map(({ d, at }, i) => (
            <g key={i} transform={`translate(${at.toFixed(1)} 0)`}>
              {/* serabut tepi krayon (titik-titik halus di luar kontur) */}
              <path
                d={d}
                {...stroke({
                  stroke: "var(--inv-crayon)",
                  strokeWidth: 33,
                  strokeOpacity: 0.45,
                  strokeDasharray: "1.2 2.6",
                })}
              />
              {/* kontur luar */}
              <path d={d} {...stroke({ stroke: "var(--inv-crayon)", strokeWidth: 30 })} />
              {/* celah tipis antara kontur & isi (warna kertas, tembus) */}
              <path
                d={d}
                {...stroke({
                  stroke: "var(--inv-bg)",
                  strokeWidth: 23,
                  strokeOpacity: 0.26,
                  strokeDasharray: "46 4 30 6 52 3",
                })}
              />
              {/* isi arsiran */}
              <path d={d} {...stroke({ stroke: "var(--inv-crayon)", strokeWidth: 19 })} />
              {STREAKS.map((s, k) => (
                <path
                  key={k}
                  d={d}
                  transform={`translate(${s.dx} ${s.dy})`}
                  {...stroke({
                    stroke: "var(--inv-bg)",
                    strokeWidth: s.w,
                    strokeOpacity: 0.42,
                    strokeDasharray: s.dash,
                  })}
                />
              ))}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
