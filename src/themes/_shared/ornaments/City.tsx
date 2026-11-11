"use client";

import { useId } from "react";

import { withAsset } from "../assets";
import { T } from "./tokens";

/**
 * Ilustrasi kota bergaya sketsa (warna sage), dipecah per bagian agar bisa
 * muncul seperti buku pop-up: jalan → menara → sayap kiri/kanan → pohon.
 * Generik (bukan gedung tertentu). Kandidat diganti ilustrasi tangan.
 */

function windowsPattern(id: string, w = 6, h = 7) {
  return (
    <pattern id={`${id}w`} width={w} height={h} patternUnits="userSpaceOnUse">
      <rect width={w} height={h} style={{ fill: T.building }} />
      <rect
        x="1.2"
        y="1.4"
        width={w - 2.4}
        height={h - 3}
        style={{ fill: T.buildingDark, opacity: 0.55 }}
      />
    </pattern>
  );
}

const line = { stroke: T.buildingLine, strokeWidth: 1, strokeLinejoin: "round" as const };

/** Menara utama (viewBox 200×170, alas di y=170). */
function TowerSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 200 170"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <defs>
        {windowsPattern(id, 5, 6)}
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* antena & mahkota */}
      <path d="M84 4 V16 M84 4 h3" style={{ ...line, fill: "none" }} />
      <rect x="72" y="16" width="26" height="10" style={{ fill: T.buildingDark, ...line }} />
      {/* menara */}
      <path d="M64 26 H106 V170 H64 Z" style={{ fill: `url(#${id}w)`, ...line }} />
      <path d="M64 26 H80 V170 H64 Z" style={{ fill: `url(#${id}g)` }} />
      <path d="M85 26 V170" style={{ ...line, opacity: 0.5 }} />
      {/* blok sayap rendah */}
      <path d="M106 84 H150 V170 H106 Z" style={{ fill: `url(#${id}w)`, ...line }} />
      <path d="M150 112 H186 V170 H150 Z" style={{ fill: `url(#${id}w)`, ...line }} />
      <path d="M30 120 H64 V170 H30 Z" style={{ fill: `url(#${id}w)`, ...line }} />
      {/* kaca miring (pantulan) */}
      <path
        d="M70 60 L78 52 M70 80 L82 68 M90 120 L100 110"
        style={{ stroke: "#fff", strokeWidth: 1.2, opacity: 0.5 }}
      />
      {/* pintu masuk */}
      <path d="M78 170 V156 H92 V170" style={{ fill: T.buildingDark, ...line }} />
    </svg>
  );
}

/** Deret gedung kiri/kanan (viewBox 120×104, alas y=104). */
function SkylineSvg({
  side = "left",
  className,
  style,
}: {
  side?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const blocks =
    side === "left"
      ? [
          [4, 40, 26, 64],
          [30, 18, 24, 86],
          [54, 52, 30, 52],
          [84, 30, 30, 74],
        ]
      : [
          [4, 34, 30, 70],
          [34, 56, 22, 48],
          [56, 12, 28, 92],
          [84, 46, 30, 58],
        ];
  return (
    <svg
      viewBox="0 0 120 104"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <defs>{windowsPattern(id)}</defs>
      {blocks.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} style={{ fill: `url(#${id}w)`, ...line }} />
          <rect x={x} y={y} width={w} height="4" style={{ fill: T.buildingDark, ...line }} />
        </g>
      ))}
      {side === "left" && (
        // jembatan penyeberangan
        <g style={{ fill: "none", ...line }}>
          <path d="M0 82 H58 M0 86 H58 M6 86 V104 M52 86 V104 M58 82 L66 104" />
        </g>
      )}
    </svg>
  );
}

/** Pohon kanopi bulat + tiang lampu (viewBox 90×60, alas y=60). */
function StreetTreeSvg({
  lamp = "left",
  className,
  style,
}: {
  lamp?: "left" | "right" | "none";
  className?: string;
  style?: React.CSSProperties;
}) {
  const canopy =
    "M30 40 C14 42, 8 30, 16 24 C12 14, 24 6, 32 12 C36 2, 54 2, 58 12 C68 8, 78 18, 72 26 C80 34, 70 44, 58 40 C52 46, 38 46, 30 40 Z";
  return (
    <svg
      viewBox="0 0 90 60"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <path d="M44 40 V60 M44 50 L38 44 M44 48 L50 42" style={{ ...line, fill: "none" }} />
      <path d={canopy} style={{ fill: T.white, ...line }} />
      <path
        d="M28 22 C32 18, 38 20, 38 24 M52 16 C56 14, 60 18, 58 22 M40 34 C44 32, 48 34, 48 36"
        style={{ ...line, fill: "none", strokeWidth: 0.7, opacity: 0.7 }}
      />
      {lamp !== "none" && (
        <g
          transform={lamp === "right" ? "translate(86 0) scale(-1 1)" : undefined}
          style={{ fill: "none", ...line }}
        >
          <path d="M4 60 V14 M4 14 H12 M0 14 H4" />
          <circle cx="12" cy="16" r="1.6" style={{ fill: T.goldLight }} />
          <circle cx="0" cy="16" r="1.6" style={{ fill: T.goldLight }} />
        </g>
      )}
    </svg>
  );
}

/** Jalan berperspektif (viewBox 360×34). */
function StreetSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 360 34"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <path d="M30 2 H330 L360 32 H0 Z" style={{ fill: T.building, ...line }} />
      <path d="M30 2 H330" style={{ ...line }} />
      <path d="M8 18 H352" strokeDasharray="14 10" style={{ stroke: T.white, strokeWidth: 1.6 }} />
      <path d="M0 32 H360" style={{ stroke: T.buildingLine, strokeWidth: 1.4 }} />
    </svg>
  );
}

/* ---------- versi yang bisa ditukar dengan file asli ---------- */
export const Tower = withAsset("city-tower", TowerSvg);
export const Skyline = withAsset<Parameters<typeof SkylineSvg>[0]>(
  (p) => (p.side === "right" ? "city-skyline-right" : "city-skyline-left"),
  SkylineSvg,
);
export const StreetTree = withAsset<Parameters<typeof StreetTreeSvg>[0]>(
  (p) => (p.lamp === "right" ? "city-tree-right" : "city-tree-left"),
  StreetTreeSvg,
);
export const Street = withAsset("city-street", StreetSvg);
