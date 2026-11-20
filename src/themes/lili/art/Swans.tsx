"use client";

import { useId } from "react";

import { FlowerDefs, PinkLily } from "./Flowers";

/**
 * Sepasang angsa putih berhadapan (leher membentuk hati) di antara lili pink
 * besar, kuncup lili, dan mawar — hiasan bawah Love Story (digambar ulang dari
 * desain). viewBox 430 × 230.
 */
const BODY =
  "M60 172 C70 150 110 140 150 146 C185 150 205 160 215 176 C210 198 180 210 140 208 C100 206 70 196 60 172Z";
/** Sayap terangkat bertepi bulu (scallop). */
const WING =
  "M70 168 C66 130 82 96 112 82 C108 96 112 104 118 108 C120 92 132 80 146 76 C142 92 146 104 156 110 C160 98 170 90 182 90 C176 104 176 120 186 134 C170 156 120 170 70 168Z";
const NECK_UP =
  "M196 166 C210 140 196 118 186 96 C176 72 184 46 204 40 C220 36 232 46 230 58 C224 54 214 52 208 58 C200 68 206 88 214 108 C224 134 222 156 206 170Z";
const NECK_BOW =
  "M196 166 C214 140 206 116 196 100 C186 84 192 64 210 62 C226 62 234 74 230 86 C224 80 214 78 210 84 C204 94 214 110 218 126 C224 146 220 160 206 170Z";

/** Angsa menghadap kanan; `bow` = leher menunduk (angsa kanan, dicerminkan). */
function Swan({ id, bow }: { id: string; bow?: boolean }) {
  return (
    <g transform={bow ? "translate(476 24) scale(-1 1)" : undefined}>
      <path d={BODY} fill={`url(#${id}-swan)`} stroke="#d2cec5" strokeWidth={1} />
      <path d={WING} fill="#fdfcf9" stroke="#d2cdc3" strokeWidth={1} />
      <g fill="none" stroke="#d3cec4" strokeWidth={0.8}>
        <path d="M84 160 C82 132 92 110 108 96" />
        <path d="M104 156 C104 130 116 110 132 94" />
        <path d="M128 152 C130 130 140 114 152 104" />
        <path d="M150 148 C154 130 162 118 174 110" />
        <path d="M80 182 C110 190 160 190 200 182" />
      </g>
      <path
        d={bow ? NECK_BOW : NECK_UP}
        fill={`url(#${id}-swan)`}
        stroke="#d2cec5"
        strokeWidth={1}
      />
      {bow ? (
        <>
          <path
            d="M228 82 C234 88 236 98 232 106 C228 98 224 92 222 86Z"
            fill="#e2905a"
            stroke="#c7703b"
            strokeWidth={0.6}
          />
          <path d="M222 76 C228 76 230 82 226 86 C222 86 220 80 222 76Z" fill="#2b2622" />
          <circle cx={219} cy={72} r={1.4} fill="#2b2622" />
        </>
      ) : (
        <>
          <path
            d="M226 50 C236 52 244 60 246 70 C238 66 230 62 224 58Z"
            fill="#e2905a"
            stroke="#c7703b"
            strokeWidth={0.6}
          />
          <path d="M220 46 C226 46 228 52 224 56 C220 56 218 50 220 46Z" fill="#2b2622" />
          <circle cx={217} cy={47} r={1.4} fill="#2b2622" />
        </>
      )}
    </g>
  );
}

function Bud({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 40 C-2 20 0 6 2 0" stroke="#7b9a5c" strokeWidth={2.2} fill="none" />
      <path
        d="M2 4 C-8 -10 -6 -34 4 -46 C14 -34 14 -10 2 4Z"
        fill="#e7a3b7"
        stroke="#fff"
        strokeWidth={1.2}
      />
      <path d="M3 2 C0 -14 2 -30 4 -42" stroke="#c97d95" strokeWidth={0.8} fill="none" />
    </g>
  );
}

export function SwanPair({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 430 230" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <FlowerDefs id={id} />
        <linearGradient id={`${id}-swan`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f3f1ec" />
          <stop offset="1" stopColor="#dedad2" />
        </linearGradient>
      </defs>
      {/* daun & kuncup di belakang */}
      <g fill="#6f9455" stroke="#fff" strokeWidth={1}>
        <path d="M20 200 C40 160 80 150 100 170 C80 176 50 190 20 200Z" />
        <path d="M410 200 C390 160 350 150 330 170 C350 176 380 190 410 200Z" />
      </g>
      <Bud x={92} y={120} rot={-8} />
      <Bud x={338} y={118} rot={10} />
      <Swan id={id} bow />
      <Swan id={id} />
      {/* lili besar kiri & kanan, mawar bawah */}
      <PinkLily id={id} x={30} y={150} s={1.3} rot={-14} />
      <PinkLily id={id} x={404} y={146} s={1.3} rot={18} />
      <PinkLily id={id} x={56} y={232} s={1.1} rot={30} />
      <PinkLily id={id} x={380} y={232} s={1.1} rot={-24} />
      <g transform="translate(160 212)">
        <circle r={13} fill="#f0b8c3" stroke="#fff" strokeWidth={1.2} />
        <path
          d="M-8 1 C-7 -9 8 -9 8 0 C8 7 -3 8 -3 1 C-3 -3 3 -3 3 1"
          fill="none"
          stroke="#d98596"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
