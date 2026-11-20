"use client";

import { useId } from "react";

/**
 * Bingkai oval barok hijau sage (digambar ulang dari desain): tepi luar
 * bergelombang, alur & cincin manik di sisi dalam, bibir dalam timbul, dan
 * pita-pita kecil di sekeliling. Kesan "tanah liat" dibuat dengan emboss
 * berlapis (bayangan + sorot + isi), tanpa filter SVG.
 *
 * viewBox 280 × 340; lubang foto = elips pusat (140,170) rx 98 ry 124 →
 * `FRAME_HOLE` untuk memposisikan foto di bawahnya.
 */
export const FRAME_W = 280;
export const FRAME_H = 340;
export const FRAME_HOLE = { cx: 140, cy: 170, rx: 98, ry: 124 };

const C = {
  base: "var(--inv-frame, #9fa466)",
  dark: "var(--inv-frame-dark, #6c7140)",
  light: "var(--inv-frame-light, #ccd29a)",
};

const f = (v: number) => v.toFixed(1);
/** Bulatkan 2 desimal: Math.sin/cos server & browser bisa beda di digit terakhir (hidrasi). */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Kontur tertutup halus dari fungsi jari-jari per sudut. */
function contour(rx: number, ry: number, wobble: (a: number) => number, n = 72) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wobble(a);
    return [140 + Math.cos(a) * rx * k, 170 + Math.sin(a) * ry * k];
  });
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
}

// Tepi luar: lekuk-lekuk cartouche (14 gelombang) + tonjolan di atas, bawah, samping.
const OUTER = contour(133, 162, (a) => 0.02 * Math.cos(a * 14) + 0.022 * Math.sin(a) ** 12 - 0.008);
const GROOVE = contour(116, 143, (a) => 0.012 * Math.cos(a * 14));
const HOLE = `M${140 - 98} 170 a98 124 0 1 0 196 0 a98 124 0 1 0 -196 0Z`;

/** Pita kecil: dua lengkung + simpul + dua ekor, emboss. */
function Bow({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  const d =
    "M0 0 C-4 -7 -12 -8 -12 -2 C-12 4 -5 3 0 0 Z M0 0 C4 -7 12 -8 12 -2 C12 4 5 3 0 0 Z M-1 1 L-6 9 L-3 9.5 L0 3 L3 9.5 L6 9 L1 1 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={d} fill={C.dark} transform="translate(0.9 1.1)" opacity={0.85} />
      <path d={d} fill={C.light} transform="translate(-0.6 -0.7)" />
      <path d={d} fill={C.base} />
      <circle r={2.6} fill={C.base} stroke={C.dark} strokeWidth={0.5} />
      <circle r={1} cx={-0.6} cy={-0.6} fill={C.light} />
    </g>
  );
}

/** Posisi di tengah rim pada sudut `deg` (0 = kanan, 90 = bawah) + rotasi tangensial. */
function onRim(deg: number) {
  const a = (deg * Math.PI) / 180;
  const rx = 125;
  const ry = 153;
  const x = r2(140 + Math.cos(a) * rx);
  const y = r2(170 + Math.sin(a) * ry);
  const rot = r2((Math.atan2(Math.sin(a) * rx, Math.cos(a) * ry) * 180) / Math.PI + 90);
  return { x, y, rot };
}
const BOWS = [-90, -125, -55, 180, 155, 0, 25, 90, 120, 60, 205, -25];

export function OvalFrame({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const beads = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return [r2(140 + Math.cos(a) * 104), r2(170 + Math.sin(a) * 130)];
  });
  return (
    <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.2} />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect width={FRAME_W} height={FRAME_H} fill="#fff" />
          <path d={HOLE} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {/* badan bingkai: bayangan tepi, sorot, isi, gradasi cahaya */}
        <path d={OUTER} fill={C.dark} transform="translate(1.6 2)" />
        <path d={OUTER} fill={C.light} transform="translate(-1.2 -1.4)" />
        <path d={OUTER} fill={C.base} />
        <path d={OUTER} fill={`url(#${id}-g)`} />
        {/* alur di tengah rim */}
        <path d={GROOVE} fill="none" stroke={C.dark} strokeWidth={4.5} opacity={0.55} />
        <path
          d={GROOVE}
          fill="none"
          stroke={C.light}
          strokeWidth={2.2}
          transform="translate(-1.2 -1.4)"
          opacity={0.9}
        />
        {/* cincin manik */}
        {beads.map(([x, y], i) => (
          <g key={i}>
            <circle cx={r2(x + 0.6)} cy={r2(y + 0.7)} r={2.6} fill={C.dark} opacity={0.7} />
            <circle cx={x} cy={y} r={2.4} fill={C.base} />
            <circle cx={r2(x - 0.7)} cy={r2(y - 0.8)} r={0.9} fill={C.light} />
          </g>
        ))}
        {/* bibir dalam timbul di tepi foto */}
        <ellipse
          cx={140}
          cy={170}
          rx={99.5}
          ry={125.5}
          fill="none"
          stroke={C.light}
          strokeWidth={3}
        />
        <ellipse
          cx={140.8}
          cy={171}
          rx={98.6}
          ry={124.6}
          fill="none"
          stroke={C.dark}
          strokeWidth={1.6}
        />
      </g>
      {BOWS.map((deg) => {
        const p = onRim(deg);
        return (
          <Bow key={deg} x={p.x} y={p.y} rot={p.rot} s={deg === -90 || deg === 90 ? 1.45 : 1.25} />
        );
      })}
    </svg>
  );
}
