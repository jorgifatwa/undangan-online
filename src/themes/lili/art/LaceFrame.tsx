"use client";

import { useId } from "react";

/**
 * Bingkai foto mempelai (digambar ulang dari desain): renda hijau pucat
 * bertepi scallop dengan kisi wajik di luar, renda putih bersemu pink berbintik
 * di dalam (dengan pita kecil di sudut), dan lubang foto bertepi kertas sobek.
 * viewBox 197 × 262; foto diletakkan di bawahnya pada `LACE_HOLE`.
 */
export const LACE_W = 197;
export const LACE_H = 262;
/** Kotak foto (sedikit lebih besar dari lubang; tepi sobek menutup sisanya). */
export const LACE_HOLE = { x: 38, y: 44, w: 121, h: 175 };

const f = (v: number) => v.toFixed(1);

function jitter(i: number, amp: number) {
  const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 2 * amp;
}

/** Keliling persegi bersudut bulat dengan tonjolan (scallop) keluar. */
function scallopRect(x: number, y: number, w: number, h: number, r: number, bump: number) {
  const pts: string[] = [];
  const side = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / (bump * 2.2)));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const tm = (t0 + t1) / 2;
      const big = i % 2 ? 1 : 1.35;
      const mx = x0 + (x1 - x0) * tm + nx * bump * big;
      const my = y0 + (y1 - y0) * tm + ny * bump * big;
      const ex = x0 + (x1 - x0) * t1;
      const ey = y0 + (y1 - y0) * t1;
      pts.push(`Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`);
    }
  };
  const start = `M${f(x + r)} ${f(y)}`;
  side(x + r, y, x + w - r, y, 0, -1);
  pts.push(`Q${f(x + w + bump * 0.6)} ${f(y - bump * 0.6)} ${f(x + w)} ${f(y + r)}`);
  side(x + w, y + r, x + w, y + h - r, 1, 0);
  pts.push(`Q${f(x + w + bump * 0.6)} ${f(y + h + bump * 0.6)} ${f(x + w - r)} ${f(y + h)}`);
  side(x + w - r, y + h, x + r, y + h, 0, 1);
  pts.push(`Q${f(x - bump * 0.6)} ${f(y + h + bump * 0.6)} ${f(x)} ${f(y + h - r)}`);
  side(x, y + h - r, x, y + r, -1, 0);
  pts.push(`Q${f(x - bump * 0.6)} ${f(y - bump * 0.6)} ${f(x + r)} ${f(y)}`);
  return `${start} ${pts.join(" ")}Z`;
}

/** Persegi bersudut bulat bertepi sobek (lubang foto). */
function deckleRect(x: number, y: number, w: number, h: number, r: number, amp: number) {
  const pts: string[] = [];
  let k = 0;
  const push = (px: number, py: number) =>
    pts.push(`${f(px + jitter(k++, amp))} ${f(py + jitter(k++, amp))}`);
  const step = 6;
  const arc = (cx: number, cy: number, a0: number) => {
    for (let a = a0; a <= a0 + 90; a += 22.5)
      push(cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r);
  };
  for (let px = x + r; px <= x + w - r; px += step) push(px, y);
  arc(x + w - r, y + r, -90);
  for (let py = y + r; py <= y + h - r; py += step) push(x + w, py);
  arc(x + w - r, y + h - r, 0);
  for (let px = x + w - r; px >= x + r; px -= step) push(px, y + h);
  arc(x + r, y + h - r, 90);
  for (let py = y + h - r; py >= y + r; py -= step) push(x, py);
  arc(x + r, y + r, 180);
  return `M${pts.join(" L")}Z`;
}

const OUTER = scallopRect(7, 7, 183, 248, 14, 5.6);
const MAT = scallopRect(20, 22, 157, 218, 10, 2.4);
const HOLE = deckleRect(42, 48, 113, 167, 16, 1.1);

function Bow({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#f1b9c7">
      <path d="M0 0 C-3 -4 -7 -4 -7 0 C-7 3 -3 3 0 0Z M0 0 C3 -4 7 -4 7 0 C7 3 3 3 0 0Z" />
      <path d="M-0.6 0.6 L-3 5 M0.6 0.6 L3 5" stroke="#f1b9c7" strokeWidth={0.9} />
      <circle r={1.1} fill="#e79db1" />
    </g>
  );
}

export function LaceFrame({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox={`0 0 ${LACE_W} ${LACE_H}`} className={className} style={style} aria-hidden>
      <defs>
        {/* kisi wajik renda hijau */}
        <pattern id={`${id}-lat`} width={8} height={8} patternUnits="userSpaceOnUse">
          <rect width={8} height={8} fill="var(--inv-lace-green, #d3dcae)" />
          <path
            d="M4 0 L8 4 L4 8 L0 4Z"
            fill="none"
            stroke="var(--inv-lace-green-dark, #b0bc85)"
            strokeWidth={0.6}
            opacity={0.55}
          />
          <circle cx={4} cy={4} r={1} fill="#eef2d8" />
        </pattern>
        {/* renda putih: titik pink kecil */}
        <pattern id={`${id}-dot`} width={5} height={5} patternUnits="userSpaceOnUse">
          <rect width={5} height={5} fill="#fbf5f4" />
          <circle cx={1.2} cy={1.2} r={0.55} fill="#efc3cd" />
          <circle cx={3.7} cy={3.7} r={0.45} fill="#e9d9b2" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="50%" cy="50%" r="60%">
          <stop offset="0.6" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="0.85" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.25} />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect width={LACE_W} height={LACE_H} fill="#fff" />
          <path d={HOLE} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {/* renda hijau luar */}
        <path d={OUTER} fill={`url(#${id}-lat)`} stroke="#e7edcb" strokeWidth={1.2} />
        <path d={OUTER} fill={`url(#${id}-fade)`} />
        {/* lubang-lubang kecil di dekat tepi */}
        {Array.from({ length: 34 }, (_, i) => {
          const t = i / 34;
          const per = 2 * (185 + 250);
          let d = t * per;
          let x: number;
          let y: number;
          if (d < 185) [x, y] = [6 + d, 11];
          else if ((d -= 185) < 250) [x, y] = [186, 6 + d];
          else if ((d -= 250) < 185) [x, y] = [191 - d, 251];
          else [x, y] = [11, 256 - (d - 185)];
          return <circle key={i} cx={f(x)} cy={f(y)} r={1.3} fill="#eef2d8" />;
        })}
        {/* renda putih-pink dalam */}
        <path d={MAT} fill={`url(#${id}-dot)`} stroke="#fff" strokeWidth={1.6} />
        <path
          d={MAT}
          fill="none"
          stroke="#f3d5dc"
          strokeWidth={0.7}
          strokeDasharray="1.5 2"
          transform="translate(0 0)"
        />
        {/* tepi sobek putih di sekeliling foto */}
        <path d={HOLE} fill="none" stroke="#fffdfb" strokeWidth={5} strokeLinejoin="round" />
      </g>
      <Bow x={33} y={34} s={0.8} />
      <Bow x={164} y={34} s={0.8} />
      <Bow x={33} y={229} s={0.8} />
      <Bow x={164} y={229} s={0.8} />
    </svg>
  );
}
