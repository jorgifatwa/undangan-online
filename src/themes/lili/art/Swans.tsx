"use client";

import Image from "next/image";
import { useId } from "react";

import { FlowerDefs, PinkLily } from "./Flowers";
import swans from "./swans.webp";

/**
 * Sepasang angsa putih berhadapan (leher membentuk hati; gambar cat air milik
 * pemilik, PNG transparan) di antara lili pink besar, kuncup lili, dan mawar
 * (SVG) — hiasan bawah Love Story. viewBox 430 × 230.
 */
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
    <div className={className} style={style} aria-hidden>
      <div
        style={{
          position: "absolute",
          left: "21%",
          top: "20%",
          width: "58%",
          aspectRatio: `${swans.width} / ${swans.height}`,
        }}
      >
        <Image src={swans} alt="" fill sizes="(max-width: 440px) 58vw, 260px" />
      </div>
      <svg
        viewBox="0 0 430 230"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        overflow="visible"
      >
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
    </div>
  );
}
