"use client";

import Image from "next/image";

import { LACE_FRAME } from "./lace-frame";
import laceFrame from "./lace-frame.webp";

/**
 * Bingkai foto mempelai: gambar bingkai renda milik pemilik (renda hijau +
 * renda putih-pink + bunga + kupu-kupu), latar kotak-kotak dibuang oleh
 * `scripts/lili-lace-frame.ts`. Ukuran dasar 197 px kanvas; `LACE_HOLE` =
 * kotak foto di bawah bingkai (sedikit lebih besar agar tepinya terselip di
 * bawah renda).
 */
export const LACE_W = 197;
export const LACE_H = Math.round(LACE_W * LACE_FRAME.ratio);
const { x, y, w, h } = LACE_FRAME.hole;
const PAD = 3;
export const LACE_HOLE = {
  x: x * LACE_W - PAD,
  y: y * LACE_H - PAD,
  w: w * LACE_W + PAD * 2,
  h: h * LACE_H + PAD * 2,
};

export function LaceFrame({ style }: { style?: React.CSSProperties }) {
  return (
    <div aria-hidden style={style}>
      <Image src={laceFrame} alt="" fill sizes="(max-width: 440px) 52vw, 230px" />
    </div>
  );
}
