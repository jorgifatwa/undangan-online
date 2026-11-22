"use client";

import Image from "next/image";

import left from "./bfly-left.webp";
import body from "./bfly-body.webp";
import right from "./bfly-right.webp";
import { BUTTERFLY } from "./bfly-size";

/**
 * Kupu-kupu pink milik pemilik (tampak atas), dipotong di garis badan jadi
 * sayap kiri, badan, sayap kanan. Sayap mengepak 3D di sumbu badan (kiri &
 * kanan terlipat ke arah penonton bergantian sedikit) — lihat li-wing-* di
 * theme.css. Kotak mengikuti rasio gambar; posisi & ukuran dari pemanggil.
 */
const { w, h, l, r } = BUTTERFLY;
const pct = (v: number) => `${((v / w) * 100).toFixed(3)}%`;

export function Butterfly({ style }: { style?: React.CSSProperties }) {
  const part = (x0: number, x1: number): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: pct(x0),
    width: pct(x1 - x0),
  });
  return (
    // pembungkus: posisi & kemiringan dari pemanggil; dalam: animasi melayang
    <div aria-hidden style={{ aspectRatio: `${w} / ${h}`, ...style }}>
      <div
        className="li-bfly"
        style={{
          position: "absolute",
          inset: 0,
          filter: "drop-shadow(0 1px 1.5px rgb(80 40 50 / 0.3))",
        }}
      >
        <div className="li-wing-l" style={part(0, l + 3)}>
          <Image src={left} alt="" fill sizes="80px" />
        </div>
        <div className="li-wing-r" style={part(r - 3, w)}>
          <Image src={right} alt="" fill sizes="80px" />
        </div>
        <div style={part(l, r)}>
          <Image src={body} alt="" fill sizes="20px" />
        </div>
      </div>
    </div>
  );
}
