"use client";

import { useId } from "react";

import { linenBg } from "./textures";

/**
 * Ornamen Surat Marun (digambar ulang dari desain referensi). Warna dari token
 * --inv-* agar varian bekerja.
 */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Kartu krem berjahit (quilted): linen + garis jahitan putus-putus di dalam tepi. */
export const quiltCard = (inset = 10): React.CSSProperties => ({
  ...linenBg("#efece6"),
  boxShadow: `0 6px 18px rgb(0 0 0 / 0.35), inset 0 0 0 ${inset}px #efece6, inset 0 0 0 ${inset + 1}px rgb(120 110 100 / 0.25)`,
  outline: "1.5px dashed rgb(150 140 130 / 0.55)",
  outlineOffset: `-${inset + 5}px`,
});

/** Tiga bingkai tanggal emas: kotak | perisai melengkung | kotak. viewBox 300 × 110. */
export function DateFrames({ style }: { style?: React.CSSProperties }) {
  const s = "var(--inv-gold, #c9b98f)";
  const box = (x: number) => (
    <g>
      <rect x={x} y={14} width={62} height={82} fill="none" stroke={s} strokeWidth={1.4} />
      <rect x={x + 4} y={18} width={54} height={74} fill="none" stroke={s} strokeWidth={0.7} />
      <path d={`M${x + 31} 10 l4 4 l-4 4 l-4 -4Z M${x + 31} 92 l4 4 l-4 4 l-4 -4Z`} fill={s} />
    </g>
  );
  const shield =
    "M150 2 C168 2 180 10 188 18 L188 92 C180 100 168 108 150 108 C132 108 120 100 112 92 L112 18 C120 10 132 2 150 2Z";
  return (
    <svg viewBox="0 0 300 110" style={style} aria-hidden>
      {box(10)}
      {box(228)}
      <path d={shield} fill="none" stroke={s} strokeWidth={1.4} />
      <path
        d={shield}
        transform="translate(150 55) scale(0.9) translate(-150 -55)"
        fill="none"
        stroke={s}
        strokeWidth={0.7}
      />
    </svg>
  );
}

/**
 * Amplop marun terbuka berisi kartu krem (judul acara di kartu). viewBox
 * 300 × 260; isi kartu diletakkan pemanggil (anak) di area kartu.
 */
export function Envelope({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const m = "var(--inv-maroon-light, #6e2a30)";
  const md = "var(--inv-maroon, #45171a)";
  return (
    <div style={{ position: "relative", aspectRatio: "300 / 260", ...style }}>
      <svg
        viewBox="0 0 300 260"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={m} />
            <stop offset="1" stopColor={md} />
          </linearGradient>
          <pattern id={`${id}-t`} width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0 0L4 4M4 0L0 4" stroke="#fff" strokeOpacity="0.05" strokeWidth="0.6" />
          </pattern>
        </defs>
        {/* badan belakang + tutup terbuka ke atas */}
        <path d="M14 110 L150 6 L286 110 V250 H14Z" fill={`url(#${id}-b)`} />
        <path d="M14 110 L150 6 L286 110 V250 H14Z" fill={`url(#${id}-t)`} />
        {/* kartu */}
        <rect x={42} y={46} width={216} height={160} rx={3} fill="#f1ede5" />
        <path d="M110 46 C120 34 180 34 190 46" fill="#e4dccd" />
        {/* kantong depan: dua sisi & bawah */}
        <path d="M14 110 L150 196 L286 110 V250 H14Z" fill={md} />
        <path
          d="M14 110 L150 196 L286 110"
          fill="none"
          stroke="rgb(0 0 0 / 0.25)"
          strokeWidth={1.5}
        />
        <path d="M14 250 L150 160 L286 250Z" fill={m} opacity={0.92} />
        <path d="M14 110 L150 196 L286 110 V250 H14Z" fill={`url(#${id}-t)`} />
      </svg>
      {/* isi kartu (di atas kartu, di bawah kantong: kantong digambar ulang di atasnya) */}
      <div
        style={{
          position: "absolute",
          left: "14%",
          right: "14%",
          top: "20%",
          height: "34%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Penjepit kertas emas. viewBox 24 × 64. */
export function Paperclip({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 64" style={style} aria-hidden>
      <path
        d="M16 20 V50 C16 58 4 58 4 50 V10 C4 2 20 2 20 10 V46 C20 50 12 50 12 46 V18"
        fill="none"
        stroke="#b7a56b"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Sketsa rumah garis (kirim kado). viewBox 120 × 90. */
export function House({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 120 90"
      style={style}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinejoin="round"
    >
      <path d="M8 86 H112" />
      <path d="M18 86 V44 L48 18 L78 44 V86" />
      <path d="M78 44 L92 32 H54 M92 32 L106 46 V86" />
      <path d="M12 48 L48 14 L84 48" />
      <path d="M72 24 V12 H80 V30" />
      <rect x={38} y={58} width={20} height={28} />
      <path d="M48 58 V86" />
      <rect x={24} y={52} width={10} height={12} />
      <path d="M29 52 V64 M24 58 H34" />
      <rect x={86} y={52} width={12} height={12} />
      <path d="M92 52 V64 M86 58 H98" />
      <circle cx={48} cy={36} r={5} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${10 + i * 2} ${86 - i * 3} q4 -4 8 0`} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`r${i}`} d={`M${100 + i * 2} ${86 - i * 3} q4 -4 8 0`} />
      ))}
    </svg>
  );
}

/** Monogram inisial bergaya bordir (garis putus-putus seperti jahitan). */
export function Monogram({ a, b, style }: { a: string; b: string; style?: React.CSSProperties }) {
  const text = (ch: string, x: number, y: number) => (
    <text
      x={x}
      y={y}
      fontFamily="var(--sm-script), 'Pinyon Script', cursive"
      fontSize={110}
      fill="none"
      stroke="var(--inv-text-muted, #b9a9a4)"
      strokeWidth={2.6}
      strokeDasharray="2.2 2.4"
      strokeLinecap="round"
    >
      {ch}
    </text>
  );
  return (
    <svg viewBox="0 0 220 170" style={style} aria-hidden>
      {text(a, 30, 92)}
      {text(b, 104, 150)}
    </svg>
  );
}

/** Bingkai pigura berbevel hijau (galeri). Bungkus isi dengan bingkai berlapis. */
export function BevelFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "4.6%",
        background: "linear-gradient(135deg, #8aa08b 0%, #4f6a52 45%, #2c432f 100%)",
        boxShadow: "0 8px 22px rgb(0 0 0 / 0.45), inset 0 0 0 2px rgb(255 255 255 / 0.25)",
        ...style,
      }}
    >
      {/* hiasan gantungan */}
      <svg
        viewBox="0 0 40 20"
        style={{
          position: "absolute",
          left: "50%",
          top: "-7%",
          width: "10%",
          transform: "translateX(-50%)",
        }}
        aria-hidden
      >
        <path d="M2 19 L20 3 L38 19" fill="none" stroke="#7f957f" strokeWidth={1.2} />
        <circle cx={20} cy={3} r={2} fill="#9fb29f" />
      </svg>
      <div
        style={{
          position: "relative",
          padding: "3%",
          background: "linear-gradient(315deg, #8aa08b 0%, #4f6a52 50%, #2c432f 100%)",
          boxShadow: "inset 0 2px 6px rgb(0 0 0 / 0.5)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Kartu krem bergaris tipis (kartu kertas "The Bride", "Thank You"). */
export const paperCard = (): React.CSSProperties => ({
  ...linenBg("#f0ede3"),
  boxShadow: "0 6px 16px rgb(0 0 0 / 0.35)",
});

export { r2 };
