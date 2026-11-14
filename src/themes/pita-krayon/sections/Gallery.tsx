"use client";

import Image from "next/image";
import { useState } from "react";

import type { Photo } from "@/schemas/common";

import { Lightbox } from "../../_shared/sections";
import { useInvitation } from "../../_shared/runtime/context";
import { Orn, Section, txt, Typewriter, u, useCountdownStrip, useDecor } from "../canvas";
import { Ribbon, Sparkle } from "../ornaments";

/**
 * Galeri = strip foto photobooth merah (seperti desain "SEE YOU ON"), rapi
 * untuk 1–12 foto: 1 → satu bingkai, 2–4 → satu strip, 5–8 → dua strip,
 * 9–12 → tiga strip; strip dimiringkan bergantian. Ketuk foto → lightbox.
 */
function split(photos: Photo[]): Photo[][] {
  const n = photos.length;
  const strips = n <= 4 ? 1 : n <= 8 ? 2 : 3;
  const out: Photo[][] = [];
  let at = 0;
  for (let s = 0; s < strips; s++) {
    const size = Math.ceil((n - at) / (strips - s));
    out.push(photos.slice(at, at + size));
    at += size;
  }
  return out;
}

const STRIP_W = { 1: 176, 2: 148, 3: 118 } as const;
const TILT = [-5, 5, -3];

export function PhotoStrips() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const [open, setOpen] = useState<number | null>(null);
  // 3 foto pertama sudah tampil di strip hitung mundur (bila section itu tampil)
  const skip = useCountdownStrip().length;
  const photos = inv.data.gallery;
  const rest = photos.slice(skip);
  if (!rest.length) return null;
  const strips = split(rest);
  const w = STRIP_W[strips.length as 1 | 2 | 3];
  let index = skip; // indeks lightbox = posisi di galeri penuh

  return (
    <Section id="galeri" style={{ padding: `${u(26)} ${u(14)} ${u(56)}` }}>
      <Orn
        slot="ribbon-c"
        l={330}
        t={8}
        w={50}
        ratio={1.32}
        rotate={10}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-pair"
        l={36}
        t={22}
        w={24}
        ratio={1.22}
        tint={false}
        a="fade"
        d={0.4}
        fallback={<Sparkle />}
      />
      <h2 style={{ ...txt(31, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 }) }}>
        <Typewriter text={t.gallery} delay={0.1} />
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: u(strips.length === 3 ? 10 : 18),
          marginTop: u(28),
        }}
      >
        {strips.map((strip, s) => (
          <div
            key={s}
            data-a="strip"
            style={{
              width: u(w),
              // strip tengah (3 strip) sedikit lebih rendah → tumpukan acak
              marginTop: u(strips.length === 3 && s === 1 ? 36 : s === 1 ? 24 : 0),
              ["--d" as string]: `${0.25 + s * 0.18}s`,
            }}
          >
            <div
              style={{
                transform: `rotate(${strips.length === 1 && strip.length === 1 ? -4 : TILT[s]}deg)`,
                background: "var(--inv-deep)",
                padding: `${u(9)} ${u(9)} ${u(strip.length === 1 ? 34 : 9)}`,
                display: "flex",
                flexDirection: "column",
                gap: u(8),
                boxShadow: `0 ${u(10)} ${u(22)} rgb(0 0 0 / 0.18)`,
              }}
            >
              {strip.map((p) => {
                const i = index++;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`Buka foto ${i + 1}`}
                    className="pk-focus"
                    style={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      aspectRatio: "3 / 4",
                      overflow: "hidden",
                      background: "var(--inv-bg-alt)",
                    }}
                  >
                    <Image
                      src={p.url}
                      alt={p.alt ?? `Foto ${i + 1}`}
                      fill
                      sizes={`(max-width: 440px) ${Math.round((w / 430) * 100)}vw, ${w}px`}
                      style={{
                        objectFit: "cover",
                        objectPosition: `${p.focusX ?? 50}% ${p.focusY ?? 50}%`,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {open !== null && (
        <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </Section>
  );
}
