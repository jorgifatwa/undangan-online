"use client";

import { useId } from "react";

/**
 * Segel lilin abu-hijau pucat dengan emboss mawar bertangkai (digambar ulang
 * dari desain). Emboss tiap bagian = bentuk yang sama digambar tiga kali:
 * bayangan (geser kanan-bawah), sorot (geser kiri-atas), lalu isi — urut dari
 * belakang ke depan, jadi kelopak yang bertumpuk tetap terbaca. Murah, tanpa
 * filter SVG. viewBox 200 × 200.
 */
type Part = { d: string; line?: boolean; w?: number; t?: string };

/** Kelopak mawar dari belakang ke depan (kepala lebar ±84, seperti desain). */
const HEAD: Part[] = [
  // kelopak belakang
  { d: "M60 66 C54 50 64 38 80 38 C78 48 78 60 82 74 C72 76 64 74 60 66 Z" },
  { d: "M140 66 C146 50 136 38 120 38 C122 48 122 60 118 74 C128 76 136 74 140 66 Z" },
  { d: "M78 40 C84 29 116 29 122 40 C112 46 88 46 78 40 Z" },
  // kuncup tengah + pilinan
  { d: "M86 58 C84 44 98 40 106 42 C118 44 120 56 114 64 C106 70 92 69 86 58 Z" },
  { d: "M94 56 C94 47 108 46 110 54 C112 62 100 64 98 58 C97 54 102 52 105 55", line: true },
  // kelopak tengah yang membungkus kuncup
  { d: "M70 68 C68 52 84 44 98 48 C90 54 86 64 88 80 C80 80 72 76 70 68 Z" },
  { d: "M130 68 C132 52 116 44 102 48 C110 54 114 64 112 80 C120 80 128 76 130 68 Z" },
  // kelopak depan: bibir cangkir yang menggulung + kelopak bawah
  {
    d: "M58 66 C62 82 78 94 100 95 C122 94 138 82 142 66 C132 76 116 82 100 82 C84 82 68 76 58 66 Z",
  },
  {
    d: "M68 80 C76 94 88 100 100 100 C112 100 124 94 132 80 C122 88 110 91 100 91 C90 91 78 88 68 80 Z",
  },
];

/** Daun lonjong runcing dengan urat tengah & dua urat samping. */
function leaf(x: number, y: number, rot: number, len: number): Part[] {
  const w = len * 0.42;
  const t = `translate(${x} ${y}) rotate(${rot})`;
  return [
    {
      d: `M0 0 C${w} ${-len * 0.2} ${w * 0.9} ${-len * 0.75} 0 ${-len} C${-w * 0.9} ${-len * 0.75} ${-w} ${-len * 0.2} 0 0 Z`,
      t,
    },
    { d: `M0 -2 L0 ${-len * 0.88}`, t, line: true, w: 0.8 },
    {
      d: `M0 ${-len * 0.4} L${w * 0.5} ${-len * 0.55} M0 ${-len * 0.6} L${-w * 0.5} ${-len * 0.74}`,
      t,
      line: true,
      w: 0.6,
    },
  ];
}

const STEM: Part[] = [
  { d: "M100 99 C97 120 102 142 97 172", line: true, w: 4.4 },
  { d: "M98.6 124 l-5.5 -3.2 l5 -1.2 Z" },
  { d: "M100.4 148 l5.5 -2.8 l-4.8 -1.8 Z" },
  { d: "M100 162 l-5 -2 l4.6 -2 Z" },
];
const SEPALS: Part[] = [
  { d: "M99 98 C94 101 90 105 86 110 C92 108 96 104 99 100 Z" },
  { d: "M101 98 C106 101 110 104 114 108 C108 107 104 104 101 100 Z" },
  { d: "M100 99 C99 104 100 108 100 112 C101 108 102 104 100 99 Z" },
];
const LEAVES: Part[] = [
  ...leaf(98, 128, -62, 34),
  ...leaf(72, 120, -100, 22),
  ...leaf(99, 150, 58, 32),
  ...leaf(122, 157, 98, 21),
];

/** Urutan gambar: tangkai & daun dulu, lalu kelopak (belakang → depan). */
const PARTS: Part[] = [...STEM, ...LEAVES, ...SEPALS, ...HEAD];

function Emboss({ p, seal, dark }: { p: Part; seal: string; dark: string }) {
  if (p.t)
    return (
      <g transform={p.t}>
        <Emboss p={{ ...p, t: undefined }} seal={seal} dark={dark} />
      </g>
    );
  const sw = p.w ?? 1.2;
  if (p.line)
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={p.d} stroke={dark} strokeWidth={sw + 1} transform="translate(1.4 1.6)" />
        <path d={p.d} stroke="#f4f4ec" strokeWidth={sw + 0.6} transform="translate(-0.9 -1)" />
        <path d={p.d} stroke={seal} strokeWidth={sw} />
      </g>
    );
  return (
    <g strokeLinejoin="round">
      <path d={p.d} fill={dark} stroke={dark} strokeWidth={1.6} transform="translate(1.5 1.7)" />
      <path
        d={p.d}
        fill="#f4f4ec"
        stroke="#f4f4ec"
        strokeWidth={1.2}
        transform="translate(-0.9 -1)"
      />
      <path d={p.d} fill={seal} />
      <path d={p.d} fill="none" stroke={dark} strokeWidth={0.5} opacity={0.45} />
    </g>
  );
}

/** Tepi lilin yang meluber: titik tak beraturan disambung kurva kuadratik. */
const BLOB = (() => {
  const n = 16;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 94 + Math.sin(i * 2.3) * 2.8 + Math.cos(i * 1.7) * 2;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
  });
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v: number) => v.toFixed(1);
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
})();

export function RoseSeal({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const seal = "var(--inv-seal, #cfcfc4)";
  const dark = "var(--inv-seal-dark, #9b9a8e)";
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={`${id}-w`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.4} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.26} />
        </radialGradient>
        <radialGradient id={`${id}-in`} cx="60%" cy="62%" r="72%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="0.8" stopColor="#000" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.16} />
        </radialGradient>
      </defs>
      {/* badan lilin */}
      <path d={BLOB} fill={seal} />
      <path d={BLOB} fill={`url(#${id}-w)`} />
      {/* bibir cetakan: cincin timbul */}
      <circle
        cx={101.5}
        cy={101.8}
        r={79.5}
        fill="none"
        stroke={dark}
        strokeWidth={5}
        opacity={0.6}
      />
      <circle cx={98.8} cy={98.8} r={80} fill="none" stroke="#fff" strokeWidth={4} opacity={0.6} />
      <circle cx={100} cy={100} r={79.5} fill="none" stroke={seal} strokeWidth={3.4} />
      {/* bidang dalam cekung: bayangan di tepi kiri-atas */}
      <circle cx={100} cy={100} r={75} fill={seal} />
      <circle cx={100} cy={100} r={75} fill={`url(#${id}-in)`} />
      <circle cx={101} cy={101} r={74} fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.5} />
      <circle cx={99} cy={99} r={74.5} fill="none" stroke={dark} strokeWidth={1.4} opacity={0.6} />
      {/* emboss mawar */}
      <g transform="translate(0 -1)">
        {PARTS.map((p, i) => (
          <Emboss key={i} p={p} seal={seal} dark={dark} />
        ))}
      </g>
    </svg>
  );
}
