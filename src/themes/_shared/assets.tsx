"use client";

import Image, { type StaticImageData } from "next/image";
import { createContext, useContext, type ComponentType } from "react";

/**
 * Sistem aset yang bisa ditukar.
 *
 * Setiap ornamen punya "slot" (mis. "wax-seal", "bouquet-hanging"). Bila tema
 * menyediakan file untuk slot itu — hasil `pnpm assets:sync` dari aset
 * berstatus free/milik di ASSET-AUDIT.md → src/themes/{tema}/assets/ — ornamen
 * menampilkan file asli. Bila tidak, ornamen memakai versi SVG orisinal.
 * Animasi tetap berjalan di kedua versi.
 */

export type ThemeAssets = Partial<Record<string, StaticImageData>>;

const AssetsContext = createContext<ThemeAssets>({});

export function ThemeAssetsProvider({
  assets,
  children,
}: {
  assets?: ThemeAssets;
  children: React.ReactNode;
}) {
  return <AssetsContext.Provider value={assets ?? {}}>{children}</AssetsContext.Provider>;
}

/** slot=false → paksa SVG; slot=undefined → pakai slot default ornamen. */
export type SlotProp = { slot?: string | false };

export function useSlotAsset(
  slot: string | false | undefined,
  defaultSlot: string,
): StaticImageData | undefined {
  const assets = useContext(AssetsContext);
  if (slot === false) return undefined;
  return assets[slot ?? defaultSlot];
}

/**
 * Gambar aset dengan ukuran mengikuti className/style pemanggil.
 *  - mode "intrinsic": inline-block + aspect-ratio file → cukup set lebar ATAU tinggi.
 *  - mode "fill": mengisi parent (absolute inset-0), untuk tekstur/latar.
 */
export function AssetImg({
  image,
  className,
  style,
  fit = "contain",
  mode = "intrinsic",
  sizes = "(max-width: 440px) 100vw, 440px",
  priority,
}: {
  image: StaticImageData;
  className?: string;
  style?: React.CSSProperties;
  fit?: "contain" | "cover" | "fill";
  mode?: "intrinsic" | "fill";
  sizes?: string;
  priority?: boolean;
}) {
  const wrapper: React.CSSProperties =
    mode === "fill"
      ? { position: "absolute", inset: 0, pointerEvents: "none", ...style }
      : {
          position: "relative",
          display: "inline-block",
          aspectRatio: `${image.width} / ${image.height}`,
          ...style,
        };
  return (
    <span className={className} style={wrapper} aria-hidden>
      <Image
        src={image}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        // GIF/WebP animasi tetap beranimasi tanpa optimasi ulang
        unoptimized={/\.(gif|anim\.webp)$/i.test(image.src)}
        style={{ objectFit: fit }}
        draggable={false}
      />
    </span>
  );
}

/**
 * Bungkus ornamen SVG agar bisa ditukar dengan file asli.
 * defaultSlot boleh berupa fungsi dari props (mis. varian buket).
 */
export function withAsset<P extends { className?: string; style?: React.CSSProperties }>(
  defaultSlot: string | ((props: P) => string),
  Svg: ComponentType<P>,
  opts: { fit?: "contain" | "cover" | "fill"; mode?: "intrinsic" | "fill" } = {},
) {
  function Swappable(props: P & SlotProp) {
    const { slot, ...rest } = props;
    const img = useSlotAsset(
      slot,
      typeof defaultSlot === "function" ? defaultSlot(rest as P) : defaultSlot,
    );
    if (img)
      return (
        <AssetImg
          image={img}
          className={rest.className}
          style={rest.style}
          fit={opts.fit}
          mode={opts.mode}
        />
      );
    return <Svg {...(rest as P)} />;
  }
  Swappable.displayName = `Swappable(${Svg.displayName ?? Svg.name})`;
  return Swappable;
}
