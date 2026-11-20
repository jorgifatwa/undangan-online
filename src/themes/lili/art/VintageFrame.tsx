"use client";

import Image from "next/image";

import type { Photo } from "@/schemas/common";
import { box, u } from "../canvas";
import { OVAL_FRAME } from "./oval-frame";
import frameImg from "./oval-frame.webp";

/**
 * Bingkai oval vintage (foto bingkai milik pemilik, diolah oleh
 * `scripts/lili-frame.ts`) + foto di lubangnya. Foto dibuat sedikit lebih
 * besar dari lubang agar tepinya terselip di bawah manik bingkai. Warna
 * bingkai mengikuti varian lewat `--inv-filter-frame`.
 */
export function VintageFrame({
  l,
  t,
  w,
  photo,
  alt,
  priority,
}: {
  /** Kotak bingkai di kanvas (px). */
  l: number;
  t: number;
  w: number;
  photo?: Photo;
  alt: string;
  priority?: boolean;
}) {
  const h = w * OVAL_FRAME.ratio;
  const { cx, cy, rx, ry } = OVAL_FRAME.hole;
  const pad = 3;
  const hole = {
    l: l + (cx - rx) * w - pad,
    t: t + (cy - ry) * h - pad,
    w: rx * 2 * w + pad * 2,
    h: ry * 2 * h + pad * 2,
  };
  return (
    <>
      <div
        style={{
          ...box(hole.l, hole.t, hole.w, hole.h),
          borderRadius: "50%",
          overflow: "hidden",
          background: "linear-gradient(160deg, var(--inv-sage-light), var(--inv-sage))",
        }}
      >
        {photo && (
          <Image
            src={photo.url}
            alt={photo.alt ?? alt}
            fill
            priority={priority}
            sizes="(max-width: 440px) 48vw, 210px"
            style={{
              objectFit: "cover",
              objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 40}%`,
            }}
          />
        )}
      </div>
      <div
        aria-hidden
        style={{
          ...box(l, t, w, h),
          filter: `var(--inv-filter-frame, saturate(1)) drop-shadow(0 ${u(2)} ${u(3)} rgb(60 60 40 / 0.3))`,
        }}
      >
        <Image
          src={frameImg}
          alt=""
          fill
          sizes="(max-width: 440px) 66vw, 300px"
          priority={priority}
        />
      </div>
    </>
  );
}
