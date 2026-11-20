"use client";

import { useId } from "react";

/**
 * Hiasan kecil di bingkai mempelai (digambar ulang dari desain): sepasang
 * kelinci cat air (putih berbulu + abu bertelinga turun) dan rangkaian mawar
 * pink pucat berdaun. Tanpa filter SVG.
 */

/** Sepasang kelinci, viewBox 46 × 42. */
export function Bunnies({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 46 42" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${id}-g`} cx="40%" cy="30%" r="75%">
          <stop offset="0" stopColor="#c9c8c6" />
          <stop offset="1" stopColor="#9d9c9a" />
        </radialGradient>
        <radialGradient id={`${id}-w`} cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.8" stopColor="#f4f1f0" />
          <stop offset="1" stopColor="#e3dedd" />
        </radialGradient>
      </defs>
      {/* kelinci abu (belakang, kanan) */}
      <ellipse cx={31} cy={31} rx={11} ry={10.5} fill={`url(#${id}-g)`} />
      <ellipse cx={29} cy={15} rx={9} ry={8.5} fill={`url(#${id}-g)`} />
      <path d="M36 11 C42 14 42 26 38 28 C35 26 35 17 34 13Z" fill="#a3a2a0" />
      <path d="M22 12 C18 16 18 24 21 26 C24 23 24 17 25 13Z" fill="#acaba9" />
      <circle cx={26.5} cy={15.5} r={1.1} fill="#3b3a3a" />
      <circle cx={32.5} cy={15.5} r={1.1} fill="#3b3a3a" />
      <ellipse cx={29.5} cy={19} rx={1.2} ry={0.8} fill="#8a7f7f" />
      {/* kelinci putih berbulu (depan, kiri) */}
      <ellipse cx={14} cy={31} rx={13} ry={11} fill={`url(#${id}-w)`} />
      <circle cx={15} cy={19} r={8} fill={`url(#${id}-w)`} />
      <path d="M10 13 C7 5 9 1 11.5 3 C13 6 13 10 13 13Z" fill="#fbf8f7" />
      <path d="M11 11 C9.5 6 10.5 4 11.5 5 C12 7 12.3 9 12.4 11Z" fill="#f3d3d9" />
      <path d="M17 12 C17 4 20 1 21.5 3.5 C22 7 20 10 19 13Z" fill="#fbf8f7" />
      <circle cx={12.5} cy={19} r={1} fill="#4a4646" />
      <circle cx={18} cy={18.6} r={1} fill="#4a4646" />
      <ellipse cx={15.4} cy={22} rx={1} ry={0.7} fill="#e7b3bd" />
      <ellipse cx={9.5} cy={22.5} rx={2} ry={1.2} fill="#f6cfd6" opacity={0.6} />
    </svg>
  );
}

/** Mawar kecil: lingkar kelopak + pilinan. */
function Rose({ x, y, r, id }: { x: number; y: number; r: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={`url(#${id}-r)`} stroke="#fff" strokeWidth={1} />
      <path
        d={`M${-r * 0.6} ${r * 0.1} C${-r * 0.5} ${-r * 0.7} ${r * 0.6} ${-r * 0.7} ${r * 0.6} 0 C${r * 0.6} ${r * 0.5} ${-r * 0.2} ${r * 0.6} ${-r * 0.2} ${r * 0.1} C${-r * 0.2} ${-r * 0.2} ${r * 0.25} ${-r * 0.25} ${r * 0.25} ${r * 0.05}`}
        fill="none"
        stroke="#e79aa8"
        strokeWidth={r * 0.12}
        strokeLinecap="round"
      />
      <circle r={r * 0.28} cx={r * 0.05} cy={-r * 0.05} fill="#e88a9c" opacity={0.7} />
    </g>
  );
}

function Leaf({ x, y, rot, l = 7 }: { x: number; y: number; rot: number; l?: number }) {
  return (
    <path
      d={`M0 0 C${l * 0.45} ${-l * 0.3} ${l * 0.4} ${-l * 0.8} 0 ${-l} C${-l * 0.4} ${-l * 0.8} ${-l * 0.45} ${-l * 0.3} 0 0Z`}
      transform={`translate(${x} ${y}) rotate(${rot})`}
      fill="#4f7a4c"
      stroke="#fff"
      strokeWidth={0.6}
    />
  );
}

/** Rangkaian mawar pucat, viewBox 44 × 62 (tangkai turun ke kiri bawah). */
export function RoseSpray({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 44 62" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${id}-r`} cx="45%" cy="45%" r="60%">
          <stop offset="0" stopColor="#f2b9c3" />
          <stop offset="0.6" stopColor="#f8dde1" />
          <stop offset="1" stopColor="#fdf3f3" />
        </radialGradient>
      </defs>
      <path
        d="M22 30 C20 40 16 50 10 60 M26 34 C30 44 30 52 33 60 M20 22 C14 26 10 30 8 34"
        fill="none"
        stroke="#5c8758"
        strokeWidth={1}
      />
      <Leaf x={14} y={46} rot={-60} l={8} />
      <Leaf x={20} y={40} rot={40} l={7} />
      <Leaf x={29} y={50} rot={-30} l={7} />
      <Leaf x={31} y={55} rot={70} l={6} />
      <Leaf x={10} y={36} rot={-100} l={6} />
      {/* bunga kecil putih (baby's breath) */}
      {[
        [33, 14],
        [36, 18],
        [31, 20],
        [38, 24],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={1.8} fill="#fdfaf6" />
      ))}
      <Rose x={18} y={10} r={7} id={id} />
      <Rose x={22} y={24} r={9} id={id} />
      <Rose x={9} y={30} r={6} id={id} />
      <Rose x={30} y={38} r={6.5} id={id} />
    </svg>
  );
}
