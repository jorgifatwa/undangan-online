"use client";

import Image from "next/image";

import type { Photo } from "@/schemas/common";
import { box, u } from "../canvas";
import { Butterfly } from "./Butterfly";
import { HERO_FRAME } from "./hero-frame";
import frameImg from "./hero-frame.webp";
import lilyImg from "./hero-lily.webp";

/**
 * Komposisi bingkai hero & penutup dari gambar milik pemilik (bingkai oval
 * vintage + lili + mutiara + kupu-kupu), dipisah jadi tiga lapisan. Foto diletakkan di bawah gambar, tepat di
 * lubang elipsnya. `w` = lebar komposisi (px kanvas).
 */
export function HeroFrame({
  l,
  t,
  w,
  photo,
  alt,
  priority,
}: {
  l: number;
  t: number;
  w: number;
  photo?: Photo;
  alt: string;
  priority?: boolean;
}) {
  const h = w * HERO_FRAME.ratio;
  const { cx, cy, rx, ry } = HERO_FRAME.hole;
  const pad = 2;
  return (
    <>
      <div
        style={{
          ...box(
            l + (cx - rx) * w - pad,
            t + (cy - ry) * h - pad,
            rx * 2 * w + pad * 2,
            ry * 2 * h + pad * 2,
          ),
          borderRadius: "50%",
          overflow: "hidden",
          background: "linear-gradient(160deg, #f6dcdc, #f2cfd0)",
        }}
      >
        {photo && (
          <Image
            src={photo.url}
            alt={photo.alt ?? alt}
            fill
            priority={priority}
            sizes="(max-width: 440px) 46vw, 200px"
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
          filter: `var(--inv-filter-frame, saturate(1)) drop-shadow(0 ${u(2)} ${u(3)} rgb(60 60 40 / 0.25))`,
        }}
      >
        {/* bingkai bersih; lili & kupu-kupu lapisan sendiri (sama ukuran) agar
            bisa bergerak: lili bergoyang di pangkalnya, kupu-kupu mengepak */}
        <Image
          src={frameImg}
          alt=""
          fill
          sizes="(max-width: 440px) 72vw, 320px"
          priority={priority}
        />
        <div className="li-sway-lily" style={{ position: "absolute", inset: 0 }}>
          <Image
            src={lilyImg}
            alt=""
            fill
            sizes="(max-width: 440px) 72vw, 320px"
            priority={priority}
          />
        </div>
        {/* kupu-kupu (lapisan sendiri) hinggap di kiri bawah bingkai, sayap mengepak */}
        <Butterfly
          style={{
            position: "absolute",
            left: "8%",
            top: "81.5%",
            width: "30%",
            rotate: "-24deg",
          }}
        />
      </div>
    </>
  );
}
