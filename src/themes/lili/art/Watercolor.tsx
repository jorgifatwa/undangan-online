"use client";

import { useId } from "react";

/**
 * Ornamen cat air pink (digambar ulang dari desain): rangkaian dua lili +
 * dua mutiara di sudut bingkai oval, dan kupu-kupu pink. Efek cat air =
 * gradasi radial dari pusat bunga + sapuan terang di tengah kelopak + tepi
 * pigmen yang sedikit lebih gelap. Tanpa filter SVG.
 */

const f = (v: number) => v.toFixed(1);
/** Bulatkan 2 desimal (hasil trigonometri server & browser bisa beda → hidrasi). */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Kelopak runcing: pangkal (0,0), ujung (0,-len). */
function petal(len: number, w: number, belly = 0.6) {
  return `M0 0 C${f(w * 0.8)} ${f(-len * 0.2)} ${f(w)} ${f(-len * belly)} 0 ${f(-len)} C${f(-w)} ${f(-len * belly)} ${f(-w * 0.8)} ${f(-len * 0.2)} 0 0Z`;
}

/** Kelopak lebar bertepi berombak (lili garis). */
function wavyPetal(len: number, w: number) {
  return `M0 0 C${f(w * 0.9)} ${f(-len * 0.15)} ${f(w * 1.15)} ${f(-len * 0.55)} ${f(w * 0.55)} ${f(-len * 0.8)} C${f(w * 0.4)} ${f(-len * 0.86)} ${f(w * 0.25)} ${f(-len * 0.9)} 0 ${f(-len)} C${f(-w * 0.3)} ${f(-len * 0.88)} ${f(-w * 0.5)} ${f(-len * 0.84)} ${f(-w * 0.6)} ${f(-len * 0.78)} C${f(-w * 1.15)} ${f(-len * 0.5)} ${f(-w * 0.9)} ${f(-len * 0.15)} 0 0Z`;
}

export function Pearl({ cx, cy, r, id }: { cx: number; cy: number; r: number; id: string }) {
  return (
    <g>
      <ellipse
        cx={cx + r * 0.15}
        cy={cy + r * 0.85}
        rx={r * 0.9}
        ry={r * 0.3}
        fill="rgb(0 0 0 / 0.12)"
      />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-pearl)`} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(170 150 160 / 0.35)"
        strokeWidth={0.6}
      />
      <ellipse
        cx={cx - r * 0.35}
        cy={cy - r * 0.38}
        rx={r * 0.28}
        ry={r * 0.2}
        fill="#fff"
        opacity={0.9}
      />
    </g>
  );
}

function PearlDefs({ id }: { id: string }) {
  return (
    <radialGradient id={`${id}-pearl`} cx="38%" cy="34%" r="68%">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.45" stopColor="#f6eff0" />
      <stop offset="0.8" stopColor="#e2d6da" />
      <stop offset="1" stopColor="#c9bcc2" />
    </radialGradient>
  );
}

/**
 * Rangkaian lili di kanan atas bingkai oval. viewBox 150 × 165 = kotak kanvas
 * (205, 90) – (355, 255) di hero.
 */
export function LilyCluster({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  // Lili A: bintang pink tua, kelopak dalam putih krem, benang sari kuning
  const A = { x: 74, y: 64 };
  const aPetals = [
    { r: -98, l: 62, w: 22 },
    { r: -30, l: 64, w: 21 },
    { r: 36, l: 58, w: 20 },
    { r: 170, l: 70, w: 21 },
    { r: -148, l: 72, w: 22 },
    { r: 112, l: 58, w: 19 },
  ];
  const aInner = [-70, -5, 65, 140, -140];
  // Lili B: pink pucat bergaris di depan bawah
  const B = { x: 98, y: 128 };
  const bPetals = [
    { r: -40, l: 56, w: 21 },
    { r: 28, l: 58, w: 22 },
    { r: 96, l: 46, w: 20 },
    { r: 158, l: 52, w: 21 },
    { r: -108, l: 50, w: 20 },
    { r: -162, l: 44, w: 17 },
  ];
  return (
    <svg viewBox="0 0 150 165" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        {/* userSpaceOnUse di grup kelopak yang sudah digeser ke pusat bunga → pusat (0,0) */}
        <radialGradient id={`${id}-a`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={72}>
          <stop offset="0" stopColor="#cf7894" />
          <stop offset="0.45" stopColor="#dc8ea6" />
          <stop offset="1" stopColor="#eaa9bc" />
        </radialGradient>
        <radialGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={52}>
          <stop offset="0" stopColor="#ef9fb8" />
          <stop offset="0.5" stopColor="#f4b9ca" />
          <stop offset="1" stopColor="#f7c8d5" />
        </radialGradient>
        <radialGradient id={`${id}-in`} cx="50%" cy="100%" r="100%">
          <stop offset="0" stopColor="#f3d7d5" />
          <stop offset="1" stopColor="#fbf1ee" />
        </radialGradient>
        <PearlDefs id={id} />
      </defs>

      {/* Lili A */}
      <g>
        {aPetals.map((p) => (
          <g key={p.r} transform={`translate(${A.x} ${A.y}) rotate(${p.r + 90})`}>
            <path d={petal(p.l, p.w)} fill={`url(#${id}-a)`} />
            <path
              d={petal(p.l, p.w)}
              fill="none"
              stroke="#c9718d"
              strokeWidth={0.8}
              opacity={0.45}
            />
            <path
              d={petal(p.l * 0.75, p.w * 0.35)}
              transform={`translate(${r2(p.w * 0.2)} 0)`}
              fill="#fff"
              opacity={0.16}
            />
            <path d={`M0 -4 L0 ${-p.l * 0.8}`} stroke="#c9718d" strokeWidth={0.6} opacity={0.4} />
          </g>
        ))}
        {/* tangkai kuncup melengkung di kiri atas */}
        <path
          d="M44 38 C34 28 30 22 38 14"
          fill="none"
          stroke="#d98ba1"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85}
        />
        {aInner.map((r) => (
          <g key={r} transform={`translate(${A.x} ${A.y}) rotate(${r + 90})`}>
            <path
              d={petal(32, 14, 0.55)}
              fill={`url(#${id}-in)`}
              stroke="#e7c5c4"
              strokeWidth={0.6}
            />
          </g>
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const a = (-150 + i * 18) * (Math.PI / 180);
          const l = 10 + (i % 3) * 3;
          return (
            <g key={i}>
              <line
                x1={A.x}
                y1={A.y}
                x2={r2(A.x + Math.cos(a) * l)}
                y2={r2(A.y + Math.sin(a) * l)}
                stroke="#e3c97a"
                strokeWidth={0.8}
              />
              <circle
                cx={r2(A.x + Math.cos(a) * l)}
                cy={r2(A.y + Math.sin(a) * l)}
                r={1.3}
                fill="#e8c766"
              />
            </g>
          );
        })}
      </g>

      {/* Lili B (garis) */}
      <g>
        {bPetals.map((p) => (
          <g key={p.r} transform={`translate(${B.x} ${B.y}) rotate(${p.r + 90})`}>
            <path d={wavyPetal(p.l, p.w)} fill={`url(#${id}-b)`} />
            <path
              d={wavyPetal(p.l, p.w)}
              fill="none"
              stroke="#d27f9a"
              strokeWidth={0.9}
              opacity={0.8}
            />
            <path
              d={`M0 -3 C2 ${-p.l * 0.4} 1 ${-p.l * 0.7} 0 ${-p.l * 0.92}`}
              fill="none"
              stroke="#d27f9a"
              strokeWidth={0.6}
              opacity={0.6}
            />
            <path
              d={`M2 -6 C${p.w * 0.5} ${-p.l * 0.4} ${p.w * 0.5} ${-p.l * 0.6} ${p.w * 0.45} ${-p.l * 0.7}`}
              fill="none"
              stroke="#d27f9a"
              strokeWidth={0.5}
              opacity={0.45}
            />
          </g>
        ))}
        {/* benang sari ke kiri atas */}
        {[-128, -118, -108].map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const l = 22 + i * 3;
          return (
            <path
              key={deg}
              d={`M${B.x} ${B.y} L${f(B.x + Math.cos(a) * l)} ${f(B.y + Math.sin(a) * l)}`}
              stroke="#eedc9a"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      <Pearl cx={20} cy={68} r={16} id={id} />
      <Pearl cx={98} cy={154} r={13} id={id} />
    </svg>
  );
}

/** Kupu-kupu pink cat air (sayap terbuka miring). viewBox 92 × 78. */
export function Butterfly({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const fore = "M78 24 C66 6 40 -4 16 0 C6 2 6 12 14 18 C30 30 56 36 74 34 Z";
  const fore2 = "M74 32 C56 22 26 16 6 24 C-2 28 0 38 8 42 C28 50 54 46 72 40 Z";
  const hind = "M70 38 C54 44 44 60 52 74 C58 82 70 80 74 70 C78 58 76 46 72 38 Z";
  const hind2 = "M76 34 C82 44 90 58 86 70 C83 78 74 76 73 66 C71 54 72 42 76 34 Z";
  const wing = (d: string, k: string) => (
    <g key={k}>
      <path d={d} fill={`url(#${id}-w)`} />
      <path d={d} fill="none" stroke="#d0708f" strokeWidth={0.8} opacity={0.7} />
    </g>
  );
  return (
    <svg viewBox="0 0 92 78" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" cx={76} cy={34} r={74}>
          <stop offset="0" stopColor="#f5c2d1" />
          <stop offset="0.6" stopColor="#f1a9bf" />
          <stop offset="1" stopColor="#e88aa8" />
        </radialGradient>
      </defs>
      {wing(fore2, "f2")}
      {wing(hind, "h")}
      {wing(hind2, "h2")}
      {wing(fore, "f")}
      {/* urat sayap & bintik */}
      <g fill="none" stroke="#d0708f" strokeWidth={0.5} opacity={0.55}>
        <path d="M76 26 C58 16 38 10 20 8" />
        <path d="M76 28 C60 22 44 20 28 20" />
        <path d="M72 36 C56 32 34 30 14 31" />
        <path d="M71 42 C64 50 60 60 60 68" />
        <path d="M75 40 C78 50 80 58 79 66" />
      </g>
      {[
        [26, 8],
        [36, 10],
        [46, 14],
        [18, 30],
        [28, 31],
      ].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={2.2} ry={1.4} fill="#c9668a" opacity={0.6} />
      ))}
      {/* badan & ujung putih */}
      <path
        d="M74 30 C78 26 84 22 86 18"
        stroke="#6f4a52"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <path d="M80 23 L85 14" stroke="#f4f1ee" strokeWidth={3.2} strokeLinecap="round" />
    </svg>
  );
}
