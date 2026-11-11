"use client";

import { useMemo } from "react";

import { withAsset } from "../assets";
import { r2, rng } from "./geom";
import { T } from "./tokens";

/**
 * Bunga vektor prosedural. Buket bunga kering adalah KANDIDAT untuk diganti
 * ilustrasi buatan tangan nanti (lihat src/themes/ASSET-NOTES.md).
 */

/* ---------- primitif ---------- */

function Rose({
  x,
  y,
  r,
  color,
  shade,
  rot = 0,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  shade: string;
  rot?: number;
}) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60 + rot);
  return (
    <g transform={`translate(${r2(x)} ${r2(y)})`}>
      <circle r={r} style={{ fill: shade }} />
      {petals.map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={r2(-r * 0.45)}
          rx={r2(r * 0.55)}
          ry={r2(r * 0.6)}
          transform={`rotate(${a})`}
          style={{ fill: color, stroke: shade, strokeWidth: 0.5 }}
        />
      ))}
      <circle r={r2(r * 0.55)} style={{ fill: color, stroke: shade, strokeWidth: 0.6 }} />
      <path
        d={`M0 0 m${r2(-r * 0.15)} 0 a${r2(r * 0.15)} ${r2(r * 0.15)} 0 1 1 ${r2(r * 0.3)} 0 a${r2(r * 0.3)} ${r2(r * 0.28)} 0 1 1 ${r2(-r * 0.5)} ${r2(r * 0.05)}`}
        fill="none"
        style={{ stroke: shade, strokeWidth: 0.9 }}
      />
    </g>
  );
}

function Ranunculus({
  x,
  y,
  r,
  color,
  shade,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  shade: string;
}) {
  return (
    <g transform={`translate(${r2(x)} ${r2(y)})`}>
      {[1, 0.78, 0.56, 0.34].map((k, i) => (
        <circle
          key={k}
          r={r2(r * k)}
          style={{ fill: i % 2 ? shade : color, stroke: shade, strokeWidth: 0.4 }}
        />
      ))}
    </g>
  );
}

function Ball({ x, y, r, stem }: { x: number; y: number; r: number; stem?: [number, number] }) {
  return (
    <g>
      {stem && (
        <path
          d={`M${r2(stem[0])} ${r2(stem[1])} Q${r2((x + stem[0]) / 2 + 3)} ${r2((y + stem[1]) / 2)} ${r2(x)} ${r2(y)}`}
          fill="none"
          style={{ stroke: T.foliageDark, strokeWidth: 0.8 }}
        />
      )}
      <circle cx={r2(x)} cy={r2(y)} r={r} style={{ fill: T.flower3 }} />
      <circle
        cx={r2(x)}
        cy={r2(y)}
        r={r2(r * 0.7)}
        fill="none"
        strokeDasharray="0.6 1.4"
        style={{ stroke: T.goldDark, strokeWidth: 1, opacity: 0.6 }}
      />
      <circle
        cx={r2(x - r * 0.35)}
        cy={r2(y - r * 0.35)}
        r={r2(r * 0.3)}
        style={{ fill: "#fff", opacity: 0.3 }}
      />
    </g>
  );
}

/** Bulu bunga (astilbe/pampas): titik-titik kecil di sepanjang sumbu melengkung. */
function Plume({
  x,
  y,
  len,
  angle,
  color,
  seed,
}: {
  x: number;
  y: number;
  len: number;
  angle: number;
  color: string;
  seed: number;
}) {
  const dots = useMemo(() => {
    const rand = rng(seed);
    const out: { x: number; y: number; r: number; o: number }[] = [];
    const a = (angle * Math.PI) / 180;
    for (let i = 0; i < 60; i++) {
      const t = i / 60;
      const along = t * len;
      const spread = (1 - t) * len * 0.22 + 1.5;
      const bend = Math.sin(t * 2.4) * len * 0.08;
      const off = (rand() - 0.5) * 2 * spread;
      const px = x + Math.sin(a) * along + Math.cos(a) * (off + bend);
      const py = y - Math.cos(a) * along + Math.sin(a) * (off + bend);
      out.push({ x: px, y: py, r: 0.9 + rand() * 1.3, o: 0.55 + rand() * 0.45 });
    }
    return out;
  }, [x, y, len, angle, seed]);
  return (
    <g>
      <path
        d={`M${r2(x)} ${r2(y)} L${r2(x + Math.sin((angle * Math.PI) / 180) * len)} ${r2(y - Math.cos((angle * Math.PI) / 180) * len)}`}
        style={{ stroke: T.foliageDark, strokeWidth: 0.6 }}
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={r2(d.x)}
          cy={r2(d.y)}
          r={r2(d.r)}
          style={{ fill: color, opacity: d.o }}
        />
      ))}
    </g>
  );
}

/** Untai bayam hias (amaranthus) yang menjuntai: manik mengecil ke ujung. */
function Strand({
  x,
  y,
  len,
  drift,
  color,
  seed,
}: {
  x: number;
  y: number;
  len: number;
  drift: number;
  color: string;
  seed: number;
}) {
  const beads = useMemo(() => {
    const rand = rng(seed);
    const out: { x: number; y: number; r: number }[] = [];
    const n = Math.floor(len / 2.4);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const px = x + drift * t * t + Math.sin(t * 9 + x) * 0.8;
      const py = y + len * t;
      out.push({ x: px + (rand() - 0.5) * 1.6, y: py, r: (1 - t) * 1.9 + 0.6 });
    }
    return out;
  }, [x, y, len, drift, seed]);
  return (
    <g>
      {beads.map((b, i) => (
        <circle key={i} cx={r2(b.x)} cy={r2(b.y)} r={r2(b.r)} style={{ fill: color }} />
      ))}
    </g>
  );
}

function Leaf({
  x,
  y,
  len,
  angle,
  color,
}: {
  x: number;
  y: number;
  len: number;
  angle: number;
  color: string;
}) {
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(angle)})`}>
      <path
        d={`M0 0 C${r2(-len * 0.22)} ${r2(-len * 0.3)} ${r2(-len * 0.14)} ${r2(-len * 0.8)} 0 ${r2(-len)} C${r2(len * 0.14)} ${r2(-len * 0.8)} ${r2(len * 0.22)} ${r2(-len * 0.3)} 0 0 Z`}
        style={{ fill: color }}
      />
      <path
        d={`M0 0 L0 ${r2(-len * 0.92)}`}
        style={{ stroke: T.foliageDark, strokeWidth: 0.5, opacity: 0.6 }}
      />
    </g>
  );
}

/* ---------- buket bunga kering ---------- */

export type BouquetVariant = "hanging" | "floor" | "accent";

/**
 * Buket bunga kering (salem, pink tua, mustard, zaitun) — padanan orisinal
 * untuk buket di Tirai Beludru. viewBox 200×260.
 *  hanging : gugus di atas, untai menjuntai panjang ke bawah (bunga gantung)
 *  floor   : gugus di bawah, bulu bunga menjulang ke atas (bunga lantai)
 *  accent  : gugus kecil untuk aksen sudut
 */
function DriedBouquetSvg({
  variant = "hanging",
  seed = 3,
  className,
  style,
}: {
  variant?: BouquetVariant;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const parts = useMemo(() => {
    const rand = rng(seed * 97 + (variant === "floor" ? 1 : variant === "accent" ? 2 : 0));
    const between = (a: number, b: number) => a + rand() * (b - a);
    const cluster =
      variant === "floor"
        ? { cx: 100, cy: 205, w: 70, h: 30 }
        : variant === "accent"
          ? { cx: 100, cy: 130, w: 45, h: 30 }
          : { cx: 100, cy: 60, w: 70, h: 34 };
    const roseColors: [string, string][] = [
      [T.flower1, T.flower4],
      [T.flower5, T.flower1],
      [T.flower2, T.flower4],
    ];
    return {
      cluster,
      strands: Array.from(
        { length: variant === "hanging" ? 13 : variant === "floor" ? 7 : 4 },
        (_, i) => ({
          x: cluster.cx + between(-cluster.w, cluster.w) * 0.8,
          y: cluster.cy + between(-4, 12),
          len:
            variant === "hanging"
              ? between(90, 185)
              : variant === "floor"
                ? between(25, 55)
                : between(30, 60),
          drift: variant === "floor" ? (i % 2 ? 1 : -1) * between(30, 60) : between(-14, 14),
          color: i % 4 === 0 ? T.flower4 : i % 3 === 0 ? T.foliageLight : T.foliage,
        }),
      ),
      plumes: Array.from({ length: variant === "accent" ? 2 : 4 }, (_, i) => ({
        x: cluster.cx + between(-cluster.w, cluster.w) * 0.6,
        y: cluster.cy + (variant === "floor" ? 0 : between(-6, 6)),
        len: variant === "floor" ? between(80, 140) : between(35, 60),
        angle: variant === "floor" ? between(-28, 28) : (i % 2 ? 1 : -1) * between(25, 70),
        color: i % 2 ? T.flower2 : T.flower5,
      })),
      leaves: Array.from({ length: variant === "accent" ? 8 : 15 }, (_, i) => ({
        x: cluster.cx + between(-cluster.w, cluster.w) * 0.85,
        y: cluster.cy + between(-cluster.h, cluster.h) * 0.6,
        len: between(18, 34),
        angle: between(-160, 160),
        color: i % 3 ? T.foliage : T.foliageDark,
      })),
      roses: Array.from({ length: variant === "accent" ? 3 : 6 }, (_, i) => ({
        x: cluster.cx + between(-cluster.w, cluster.w) * 0.55,
        y: cluster.cy + between(-cluster.h, cluster.h) * 0.45,
        r: between(9, 14),
        c: roseColors[i % 3],
        rot: between(0, 60),
      })),
      ranunculus: Array.from({ length: variant === "accent" ? 1 : 3 }, () => ({
        x: cluster.cx + between(-cluster.w, cluster.w) * 0.6,
        y: cluster.cy + between(-cluster.h, cluster.h) * 0.5,
        r: between(6, 9),
      })),
      balls: Array.from({ length: variant === "accent" ? 4 : 10 }, () => {
        const bx = cluster.cx + between(-cluster.w, cluster.w) * 0.95;
        const by =
          cluster.cy +
          between(-cluster.h * 1.6, cluster.h * 0.4) +
          (variant === "floor" ? -between(10, 60) : 0);
        return {
          x: bx,
          y: by,
          r: between(2.6, 4.2),
          stem: [cluster.cx + between(-10, 10), cluster.cy] as [number, number],
        };
      }),
    };
  }, [seed, variant]);

  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      {/* lapisan belakang: untai & bulu bunga */}
      {parts.strands.map((s, i) => (
        <Strand key={`s${i}`} {...s} seed={seed * 131 + i} />
      ))}
      {parts.plumes.map((p, i) => (
        <Plume key={`p${i}`} {...p} seed={seed * 173 + i} />
      ))}
      {parts.leaves.map((l, i) => (
        <Leaf key={`l${i}`} {...l} />
      ))}
      {parts.balls.map((b, i) => (
        <Ball key={`b${i}`} {...b} />
      ))}
      {/* depan: mawar & ranunculus */}
      {parts.ranunculus.map((r, i) => (
        <Ranunculus key={`r${i}`} {...r} color={T.flower5} shade={T.flower1} />
      ))}
      {parts.roses.map((r, i) => (
        <Rose key={`o${i}`} x={r.x} y={r.y} r={r.r} color={r.c[0]} shade={r.c[1]} rot={r.rot} />
      ))}
    </svg>
  );
}

/* ---------- bunga segar Renda Rimba ---------- */

/** Calla lily putih (2–3 tangkai). viewBox 120×260. */
function CallaLilySvg({
  stems = 3,
  className,
  style,
}: {
  stems?: 1 | 2 | 3;
  className?: string;
  style?: React.CSSProperties;
}) {
  const all = [
    { x: 60, y: 60, rot: -8, s: 1 },
    { x: 34, y: 96, rot: -28, s: 0.82 },
    { x: 84, y: 104, rot: 22, s: 0.78 },
  ].slice(0, stems);
  return (
    <svg
      viewBox="0 0 120 260"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      {all.map((f, i) => (
        <g key={i}>
          <path
            d={`M${f.x} ${f.y + 30} C ${f.x + (f.rot > 0 ? -6 : 6)} ${f.y + 110}, 60 200, 60 258`}
            fill="none"
            style={{ stroke: T.foliage, strokeWidth: 3.2 }}
          />
          <g transform={`translate(${f.x} ${f.y}) rotate(${f.rot}) scale(${f.s})`}>
            {/* spathe: corong putih menggulung */}
            <path
              d="M0 34 C-18 22, -22 -8, -6 -34 C0 -42, 10 -46, 20 -40 C10 -30, 14 -6, 8 18 C6 26, 4 30, 0 34 Z"
              style={{ fill: T.callaWhite, stroke: T.laceShade, strokeWidth: 0.8 }}
            />
            <path
              d="M-2 30 C-12 18, -14 -4, -4 -26"
              fill="none"
              style={{ stroke: T.laceShade, strokeWidth: 0.8, opacity: 0.8 }}
            />
            <path
              d="M20 -40 C14 -34, 10 -32, 2 -30"
              fill="none"
              style={{ stroke: T.laceShade, strokeWidth: 0.8 }}
            />
            {/* spadix */}
            <path
              d="M0 22 C-1 10, 0 -4, 2 -12"
              fill="none"
              strokeLinecap="round"
              style={{ stroke: T.flower3, strokeWidth: 3.4 }}
            />
            <path
              d="M0 34 C 3 30, 6 24, 8 18"
              fill="none"
              style={{ stroke: T.foliageLight, strokeWidth: 2 }}
            />
          </g>
        </g>
      ))}
      <path
        d="M60 258 C 40 220, 30 200, 22 186 C 34 196, 48 214, 60 240 Z"
        style={{ fill: T.foliage }}
      />
    </svg>
  );
}

/** Anthurium pink: spathe hati mengilap + spadix. viewBox 140×220. */
function AnthuriumSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const spathe =
    "M0 0 C-30 -14, -46 12, -30 34 C-20 48, -6 52, 0 62 C6 52, 20 48, 30 34 C46 12, 30 -14, 0 0 Z";
  return (
    <svg
      viewBox="0 0 140 220"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <path
        d="M70 120 C 66 160, 72 190, 70 220"
        fill="none"
        style={{ stroke: T.foliageDark, strokeWidth: 3 }}
      />
      {/* daun hati */}
      <path
        d="M70 150 C 30 130, 8 160, 18 190 C 30 206, 56 196, 70 172 Z"
        style={{ fill: T.foliage }}
      />
      <path
        d="M70 152 C 50 160, 34 172, 24 186"
        fill="none"
        style={{ stroke: T.foliageDark, strokeWidth: 1 }}
      />
      <g transform="translate(72 52) rotate(-10)">
        <path d={spathe} style={{ fill: T.lilyPinkDark }} transform="translate(2 3)" />
        <path d={spathe} style={{ fill: T.lilyPink }} />
        {/* urat daun bunga */}
        <path
          d="M0 4 C-2 22, -1 40, 0 58 M0 14 C-12 18, -22 22, -28 30 M0 14 C12 18, 22 22, 28 30"
          fill="none"
          style={{ stroke: T.lilyPinkDark, strokeWidth: 0.8, opacity: 0.55 }}
        />
        {/* kilau */}
        <path
          d="M-18 8 C-24 14, -24 22, -20 28"
          fill="none"
          strokeLinecap="round"
          style={{ stroke: "#fff", strokeWidth: 3, opacity: 0.35 }}
        />
        {/* spadix melengkung */}
        <path
          d="M0 6 C 2 -8, 8 -20, 18 -28"
          fill="none"
          strokeLinecap="round"
          style={{ stroke: T.flower5, strokeWidth: 5 }}
        />
        <path
          d="M0 6 C 2 -8, 8 -20, 18 -28"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="0.8 2.2"
          style={{ stroke: T.flower3, strokeWidth: 5 }}
        />
      </g>
    </svg>
  );
}

/** Lili pink (stargazer) dengan bintik & benang sari. viewBox 120×120. */
function LilySvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const petal = "M0 0 C-11 -14, -9 -40, 0 -56 C9 -40, 11 -14, 0 0 Z";
  const speckles = useMemo(() => {
    const rand = rng(5);
    return Array.from({ length: 14 }, () => ({
      y: -8 - rand() * 26,
      x: (rand() - 0.5) * 8,
      r: 0.6 + rand() * 0.9,
    }));
  }, []);
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <g transform="translate(60 62)">
        {[0, 60, 120, 180, 240, 300].map((a, i) => (
          <g key={a} transform={`rotate(${a + (i % 2 ? 4 : -4)}) scale(${i % 2 ? 0.92 : 1})`}>
            <path d={petal} style={{ fill: T.callaWhite }} />
            <path
              d="M0 -2 C-6 -14, -5 -34, 0 -46 C5 -34, 6 -14, 0 -2 Z"
              style={{ fill: T.lilyPink }}
            />
            <path d="M0 -4 L0 -48" style={{ stroke: T.lilyPinkDark, strokeWidth: 0.9 }} />
            {speckles.map((s, j) => (
              <circle
                key={j}
                cx={r2(s.x)}
                cy={r2(s.y)}
                r={r2(s.r)}
                style={{ fill: T.lilyPinkDark }}
              />
            ))}
          </g>
        ))}
        {[-24, -8, 8, 24, 40, -40].map((a, i) => (
          <g key={i} transform={`rotate(${a})`}>
            <path
              d="M0 0 C 2 -12, 1 -20, 0 -26"
              fill="none"
              style={{ stroke: T.foliageLight, strokeWidth: 0.9 }}
            />
            <ellipse cy="-27" rx="1.6" ry="3.4" style={{ fill: T.wood }} />
          </g>
        ))}
        <circle r="3" style={{ fill: T.foliageLight }} />
      </g>
    </svg>
  );
}

/* ---------- versi yang bisa ditukar dengan file asli ---------- */
const BOUQUET_SLOT: Record<BouquetVariant, string> = {
  hanging: "bouquet-hanging",
  floor: "bouquet-floor",
  accent: "bouquet-accent",
};
export const DriedBouquet = withAsset<Parameters<typeof DriedBouquetSvg>[0]>(
  (p) => BOUQUET_SLOT[p.variant ?? "hanging"],
  DriedBouquetSvg,
);
export const CallaLily = withAsset("calla-lily", CallaLilySvg);
export const Anthurium = withAsset("anthurium", AnthuriumSvg);
export const Lily = withAsset("lily", LilySvg);
