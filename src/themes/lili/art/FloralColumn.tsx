"use client";

import { u } from "../canvas";
import column from "./floral-column.webp";

/**
 * Kolom bunga di tepi layar — ubin mulus dari foto kolom bunga milik pemilik
 * (lili, alstroemeria, anggrek hijau; PNG transparan) diulang tegak sebagai
 * latar CSS. Posisi ulangan memakai koordinat GLOBAL satu blok (`from` = awal
 * section di dalam blok), jadi section yang bersebelahan menyambung tanpa
 * jahitan. Sisi kanan sedikit terpotong tepi layar seperti desain; `left` =
 * dicerminkan.
 */
/**
 * Tinggi satu ubin (satu ulangan alstroemeria → lili → anggrek) dalam px
 * kanvas. Ubin sudah dibuat mulus dari gambar pemilik (sambungan di
 * tengah anggrek), jadi berulang tanpa bunga terpotong. Sengaja kecil agar
 * sumber beresolusi rendah tetap tajam.
 */
const TILE_H = 140;
const TILE_W = (TILE_H * column.width) / column.height;
/** Bagian kolom yang keluar tepi layar (px kanvas). */
const BLEED = 26;

export function FloralColumn({
  from,
  height,
  side = "right",
  z,
}: {
  /** Awal potongan dalam koordinat blok. */
  from: number;
  /** Tinggi section (px kanvas). */
  height: number;
  side?: "left" | "right";
  z?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        right: side === "right" ? u(-BLEED) : undefined,
        left: side === "left" ? u(-BLEED) : undefined,
        width: u(TILE_W),
        height: u(height),
        pointerEvents: "none",
        zIndex: z,
        backgroundImage: `url(${column.src})`,
        backgroundSize: `${u(TILE_W)} ${u(TILE_H)}`,
        backgroundRepeat: "repeat-y",
        backgroundPosition: `0 ${u(-from)}`,
        transform: side === "left" ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

/** Kabut/asap putih lembut di latar sage (gradasi radial, tanpa gambar). */
export function smoke(spots: { x: number; y: number; w: number; h: number; a?: number }[]) {
  return spots
    .map(
      (s) =>
        `radial-gradient(ellipse ${s.w}% ${s.h}% at ${s.x}% ${s.y}%, rgb(236 232 220 / ${s.a ?? 0.22}), transparent 72%)`,
    )
    .join(", ");
}
