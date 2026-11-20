"use client";

import { useId } from "react";

/**
 * Pita renda guipure putih yang melintang di cover (digambar ulang dari
 * desain): pita sedikit melengkung (tengah lebih rendah), jaring halus, tepi
 * atas berbintil, tepi bawah scallop besar berlubang oval, dan medalion —
 * mahkota tiga lengkung + simpul padat + pita "X" berekor panjang + daun
 * menyamping. viewBox 430 × 200 (koordinat kanvas cover).
 */
const W = 430;
const LACE = "var(--inv-lace, #f8f5ee)";
const TOP = 60; // tepi atas pita (di x = 0)
const BOT = 138; // pangkal scallop bawah (di x = 0)
const SAG = 9; // lengkung: tengah pita turun sebanyak ini

/** Pergeseran vertikal & kemiringan pita di x. */
const dy = (x: number) => SAG * (1 - ((x - W / 2) / (W / 2)) ** 2);
const slope = (x: number) => (Math.atan((-2 * SAG * (x - W / 2)) / (W / 2) ** 2) * 180) / Math.PI;
const at = (x: number, y: number) =>
  `translate(${x.toFixed(1)} ${(y + dy(x)).toFixed(1)}) rotate(${slope(x).toFixed(2)})`;

/** Kurva tepi pita sepanjang lebar (untuk tali & isi jaring). */
function edge(y: number, from = -10, to = W + 10, step = 10) {
  let d = "";
  const n = Math.round((to - from) / step);
  for (let i = 0; i <= n; i++) {
    const x = from + i * step;
    d += `${d ? " L" : "M"}${x} ${(y + dy(x)).toFixed(1)}`;
  }
  return d;
}

/** Tetesan: ujung runcing di (0,0), membulat ke arah -y sepanjang `len`. */
function drop(len: number, w: number) {
  return `M0 0 C${w * 0.9} ${-len * 0.25} ${w} ${-len * 0.82} 0 ${-len} C${-w} ${-len * 0.82} ${-w * 0.9} ${-len * 0.25} 0 0Z`;
}

/** Daun/kelopak renda: tali tebal + isi jaring + urat/lubang dalam. */
function Leaf({
  x,
  y,
  rot,
  len,
  w,
  mesh,
  solid,
}: {
  x: number;
  y: number;
  rot: number;
  len: number;
  w: number;
  mesh: string;
  solid?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d={drop(len, w)}
        fill={solid ? LACE : `url(#${mesh})`}
        fillOpacity={solid ? 0.9 : 1}
        stroke={LACE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={drop(len * 0.6, w * 0.45)}
        transform={`translate(0 ${-len * 0.18})`}
        fill={solid ? "none" : LACE}
        fillOpacity={0.35}
        stroke={solid ? "rgb(0 0 0 / 0.14)" : LACE}
        strokeWidth={solid ? 0.8 : 1.4}
      />
    </g>
  );
}

/** Lengkung bulat bertali tebal dengan lubang (mahkota medalion). */
function Loop({
  x,
  y,
  r,
  rot = 0,
  mesh,
}: {
  x: number;
  y: number;
  r: number;
  rot?: number;
  mesh: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d={`M${-r * 0.75} 0 C${-r * 1.15} ${-r * 1.4} ${r * 1.15} ${-r * 1.4} ${r * 0.75} 0`}
        fill={`url(#${mesh})`}
        stroke={LACE}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <path
        d={`M${-r * 0.42} ${-r * 0.1} C${-r * 0.62} ${-r * 0.95} ${r * 0.62} ${-r * 0.95} ${r * 0.42} ${-r * 0.1}`}
        fill="none"
        stroke={LACE}
        strokeWidth={1.6}
      />
      {[-0.8, -0.4, 0, 0.4, 0.8].map((t) => (
        <circle
          key={t}
          cx={Math.sin(t) * r * 1.02}
          cy={-Math.cos(t) * r * 1.1 - 2.6}
          r={1.7}
          fill={LACE}
        />
      ))}
    </g>
  );
}

function Medallion({ cx, mesh }: { cx: number; mesh: string }) {
  const cy = 96;
  return (
    <g transform={at(cx, 0)}>
      <g transform={`translate(${-cx} 0)`}>
        {/* mahkota tiga lengkung di atas pita */}
        <Loop x={cx - 22} y={48} r={15} rot={-28} mesh={mesh} />
        <Loop x={cx + 22} y={48} r={15} rot={28} mesh={mesh} />
        <Loop x={cx} y={40} r={18} mesh={mesh} />
        <Leaf x={cx} y={60} rot={0} len={26} w={7} mesh={mesh} solid />
        {/* simpul padat di pangkal mahkota */}
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={cx - 16 + i * 4} cy={64 + (i % 2) * 3} r={2.4} fill={LACE} />
        ))}
        {/* daun menyamping */}
        <Leaf x={cx - 14} y={cy - 4} rot={-100} len={62} w={14} mesh={mesh} />
        <Leaf x={cx + 14} y={cy - 4} rot={100} len={62} w={14} mesh={mesh} />
        {/* pita "X": dua kelopak atas pendek, dua ekor bawah panjang */}
        <Leaf x={cx} y={cy} rot={-42} len={30} w={11} mesh={mesh} solid />
        <Leaf x={cx} y={cy} rot={42} len={30} w={11} mesh={mesh} solid />
        <Leaf x={cx} y={cy} rot={-148} len={46} w={11} mesh={mesh} solid />
        <Leaf x={cx} y={cy} rot={148} len={46} w={11} mesh={mesh} solid />
        <circle cx={cx} cy={cy} r={6.5} fill={LACE} stroke="rgb(0 0 0 / 0.15)" strokeWidth={0.7} />
        <circle cx={cx} cy={cy} r={2.8} fill="none" stroke="rgb(0 0 0 / 0.18)" strokeWidth={0.7} />
      </g>
    </g>
  );
}

function Spray({ x, y, flip, mesh }: { x: number; y: number; flip?: boolean; mesh: string }) {
  return (
    <g transform={at(x, y)}>
      <g transform={`scale(${flip ? -1 : 1} 1)`}>
        <path d="M-22 12 C-10 5 4 1 22 -9" fill="none" stroke={LACE} strokeWidth={2} />
        <Leaf x={-6} y={7} rot={-30} len={20} w={7} mesh={mesh} />
        <Leaf x={6} y={1} rot={22} len={19} w={7} mesh={mesh} />
        <Leaf x={14} y={-5} rot={72} len={16} w={6} mesh={mesh} />
        <Leaf x={-14} y={10} rot={-112} len={15} w={6} mesh={mesh} />
      </g>
    </g>
  );
}

export function LaceBand({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const mesh = `${id}-mesh`;
  const scW = 44;
  const scallops: number[] = [];
  for (let x = -14; x < W + scW; x += scW) scallops.push(x);
  const body = `${edge(TOP)} ${edge(BOT, W + 10, -10, -10).replace(/^M/, "L")} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} 200`}
      className={className}
      style={style}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={mesh}
          width={3.4}
          height={3.4}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(36)"
        >
          <path d="M0 0H3.4M0 0V3.4" stroke={LACE} strokeWidth={0.8} strokeOpacity={0.9} />
        </pattern>
      </defs>

      {/* jaring dasar mengikuti lengkung pita */}
      <path d={body} fill={`url(#${mesh})`} />

      {/* tepi atas: tali + bintil */}
      <path d={edge(TOP)} fill="none" stroke={LACE} strokeWidth={3} />
      <path d={edge(TOP + 6)} fill="none" stroke={LACE} strokeWidth={1.2} />
      {Array.from({ length: Math.ceil(W / 9) + 1 }, (_, i) => {
        const x = i * 9 + 3;
        return <circle key={i} cx={x} cy={TOP - 4.5 + dy(x)} r={2.6} fill={LACE} />;
      })}

      {/* tepi bawah: scallop besar dengan lubang oval & bintil luar */}
      {scallops.map((x0) => {
        const r = scW / 2;
        return (
          <g key={x0} transform={at(x0 + r, BOT)}>
            <path
              d={`M${-r} 0 A${r} ${r * 1.15} 0 0 0 ${r} 0`}
              fill={`url(#${mesh})`}
              stroke={LACE}
              strokeWidth={3.2}
            />
            <ellipse
              cx={0}
              cy={r * 0.5}
              rx={r * 0.52}
              ry={r * 0.36}
              fill="none"
              stroke={LACE}
              strokeWidth={2.4}
            />
            {[-0.62, -0.31, 0, 0.31, 0.62].map((t) => {
              const a = Math.PI / 2 + t * Math.PI * 0.5;
              return (
                <circle
                  key={t}
                  cx={Math.cos(a) * (r + 2.6)}
                  cy={Math.sin(a) * (r * 1.15 + 2.6)}
                  r={2}
                  fill={LACE}
                />
              );
            })}
            {/* simpul di antara dua scallop */}
            <circle cx={r} cy={2} r={3} fill={LACE} />
          </g>
        );
      })}

      {/* motif pengisi di jaring */}
      <Spray x={158} y={102} mesh={mesh} />
      <Spray x={272} y={102} flip mesh={mesh} />
      <Spray x={215} y={96} mesh={mesh} />
      <Spray x={150} y={124} flip mesh={mesh} />
      <Spray x={282} y={124} mesh={mesh} />

      <Medallion cx={64} mesh={mesh} />
      <Medallion cx={386} mesh={mesh} />
    </svg>
  );
}
