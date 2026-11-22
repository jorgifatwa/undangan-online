"use client";

import Image from "next/image";

import swans from "./swans.webp";

/**
 * Sepasang angsa putih (gambar milik pemilik, PNG transparan; angsa kiri di
 * belakang, kanan di depan) — hiasan bawah Love Story seperti desain. Gambar
 * diekspor selebar layar 482 px → skala 430/482, lebar ±277 px kanvas.
 */
const K = 430 / 482;
export const SWANS_W = swans.width * K;
export const SWANS_H = swans.height * K;

export function SwanPair({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style} aria-hidden>
      <div className="li-float" style={{ position: "absolute", inset: 0 }}>
        <Image src={swans} alt="" fill sizes="(max-width: 440px) 64vw, 280px" />
      </div>
    </div>
  );
}
