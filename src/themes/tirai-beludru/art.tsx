"use client";

import { AssetImg, useSlotAsset } from "../_shared/assets";
import { CANVAS_W } from "./canvas";

/**
 * Isi kotak kanvas dengan file asli slot (status milik/free di ASSET-AUDIT.md)
 * atau, bila tidak ada, dengan pengganti SVG orisinal.
 * `w` = lebar kotak dalam satuan kanvas → atribut sizes yang tepat untuk
 * next/image (kolom maks. 440 px), agar HP tidak mengunduh gambar terlalu besar.
 */
export function Art({
  slot,
  fallback,
  w = CANVAS_W,
  fit = "fill",
  priority,
  filter,
}: {
  slot: string;
  fallback: React.ReactNode;
  w?: number;
  fit?: "fill" | "cover" | "contain";
  priority?: boolean;
  /** Filter CSS varian warna (mis. var(--inv-filter-drape)). */
  filter?: string;
}) {
  const img = useSlotAsset(undefined, slot);
  if (img) {
    const vw = Math.min(100, Math.round((w / CANVAS_W) * 100));
    const px = Math.round(w);
    return (
      <AssetImg
        image={img}
        mode="fill"
        fit={fit}
        priority={priority}
        sizes={`(max-width: 440px) ${vw}vw, ${px}px`}
        style={filter ? { filter } : undefined}
      />
    );
  }
  return <div style={{ position: "absolute", inset: 0, filter }}>{fallback}</div>;
}
