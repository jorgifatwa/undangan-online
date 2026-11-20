"use client";

import { useId } from "react";

import { box } from "../canvas";
import { ColumnFlowerArt, FlowerDefs, columnFlowers } from "./Flowers";

/**
 * Kolom bunga di tepi layar (lili, anggrek hijau, alstroemeria, gladiol).
 * Pola bunga memakai koordinat GLOBAL satu blok (mis. blok sage salam +
 * mempelai wanita); tiap section menggambar potongan [from, from + height]
 * dari pola yang sama dan memotongnya di batas section, jadi section yang
 * bersebelahan menyambung tanpa jahitan (bunga di batas tergambar identik di
 * kedua sisi).
 */
export function FloralColumn({
  from,
  height,
  total,
  side = "right",
  z,
}: {
  /** Awal potongan dalam koordinat blok. */
  from: number;
  /** Tinggi section (px kanvas). */
  height: number;
  /** Tinggi seluruh blok (untuk membuat pola). */
  total: number;
  side?: "left" | "right";
  z?: number;
}) {
  const id = useId().replace(/:/g, "");
  const flowers = columnFlowers(total).filter(
    (fl) => fl.y > from - 90 && fl.y < from + height + 90,
  );
  return (
    <div
      aria-hidden
      style={{
        ...box(0, 0, 430, height),
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: z,
        transform: side === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <svg
        viewBox={`0 ${from} 430 ${height}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        overflow="hidden"
      >
        <defs>
          <FlowerDefs id={id} />
        </defs>
        {flowers.map((fl, i) => (
          <ColumnFlowerArt key={i} id={id} fl={fl} />
        ))}
      </svg>
    </div>
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
