"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Reveal, type RevealVariant } from "../_shared/motion/Reveal";

/**
 * Sistem kanvas Tirai Beludru — port dari canvasLayout desain referensi.
 * Setiap section digambar pada kanvas selebar 440 px dan berskala linear
 * dengan lebar kolom: `u(px)` → satuan cqw (section memakai
 * `container-type: inline-size`). Koordinat di file-file tema ini adalah
 * koordinat asli desain pemilik.
 */

export const CANVAS_W = 440;
export const u = (px: number) => `${((px / CANVAS_W) * 100).toFixed(4)}cqw`;

export type Box = readonly [x: number, y: number, w: number, h: number];

/** Font tema (variabel dari fonts.ts). */
export const F = {
  script: "var(--tb-script), 'Pinyon Script', cursive", // padanan Sloop Script
  saveDate: "var(--tb-savedate), 'Italianno', cursive", // padanan SaveTheDate
  cormorant: "var(--tb-cormorant), 'Cormorant Garamond', serif",
  verse: "var(--tb-verse), 'Noto Serif', serif",
  body: "var(--tb-body), 'Quattrocento', serif",
} as const;

export const CREAM = "var(--inv-cream, #faf3ed)";

/**
 * Teks kanvas: desain asli merender teks pada ukuran dasar lalu menskalakan
 * kotaknya (renderScale) — cara ini mempertahankan ketebalan goresan
 * seperti di desain. `fit` mengecilkan teks bila isinya (data user) lebih
 * lebar dari kotak, supaya nama panjang tidak terpotong.
 */
export function canvasText(
  box: readonly [x: number, y: number, w: number],
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  o: {
    letterSpacing?: number;
    align?: React.CSSProperties["textAlign"];
    bold?: boolean;
    renderScale?: number;
    color?: string;
    wrap?: boolean;
  } = {},
): React.CSSProperties {
  const k = o.renderScale ?? 0.322108;
  return {
    // faktor skala render disimpan agar <CText reveal> bisa menghitung lebar visual
    ["--k" as string]: k,
    position: "absolute",
    left: u(box[0]),
    top: u(box[1]),
    width: u(box[2] / k),
    margin: 0,
    transform: `scale(${k})`,
    transformOrigin: "0 0",
    fontFamily,
    fontSize: u(fontSize / k),
    lineHeight: u(lineHeight / k),
    letterSpacing: u((o.letterSpacing ?? 0) / k),
    fontWeight: o.bold ? 700 : 400,
    color: o.color ?? CREAM,
    textAlign: o.align ?? "center",
    whiteSpace: o.wrap ? "normal" : "nowrap",
    pointerEvents: "none",
  };
}

/** Teks berposisi absolut + animasi masuk + penyesuaian ukuran otomatis bila meluap. */
export function CText({
  style,
  reveal,
  delay,
  children,
  fit = true,
  maxLines,
}: {
  style: React.CSSProperties;
  reveal?: RevealVariant;
  delay?: number;
  children: React.ReactNode;
  /** Kecilkan font bila teks lebih lebar dari kotak (atau melebihi maxLines). */
  fit?: boolean;
  maxLines?: number;
}) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!fit || !el) return;
    setScale(1);
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
      const tooWide = el.scrollWidth > el.clientWidth + 1;
      const tooTall = maxLines ? el.scrollHeight > lh * maxLines + 1 : false;
      if (tooWide || tooTall) {
        const s = Math.min(
          tooWide ? el.clientWidth / el.scrollWidth : 1,
          tooTall && maxLines ? (lh * maxLines) / el.scrollHeight : 1,
        );
        setScale(Math.max(0.55, s * 0.98));
      }
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [children, fit, maxLines]);

  const finalStyle: React.CSSProperties =
    scale === 1
      ? style
      : {
          ...style,
          fontSize: `calc(${style.fontSize} * ${scale.toFixed(3)})`,
          lineHeight: `calc(${style.lineHeight} * ${scale.toFixed(3)})`,
        };

  if (!reveal) {
    return (
      <p ref={ref} style={finalStyle}>
        {children}
      </p>
    );
  }
  // Reveal memegang posisi & lebar visual; teks di dalamnya tetap memakai
  // transform skala desain (scale(k) dari sudut kiri atas).
  const k = Number((style as Record<string, unknown>)["--k"] ?? 1);
  return (
    <Reveal
      variant={reveal}
      delay={delay}
      style={{
        position: "absolute",
        left: style.left,
        top: style.top,
        width: `calc(${String(style.width)} * ${k})`,
        pointerEvents: "none",
      }}
    >
      <p ref={ref} style={{ ...finalStyle, position: "relative", left: 0, top: 0 }}>
        {children}
      </p>
    </Reveal>
  );
}

/**
 * Elemen gambar pada kotak `img`, terlihat hanya di dalam kotak `clip`
 * (keduanya koordinat kanvas) — padanan ClippedImage desain referensi.
 * children mengisi kotak img (mis. <Art slot=…/>).
 */
export function Placed({
  img,
  clip = img,
  clipPath,
  flipX,
  rotate,
  reveal,
  delay,
  parallax,
  className,
  style,
  children,
}: {
  img: Box;
  clip?: Box;
  clipPath?: string;
  flipX?: boolean;
  rotate?: number;
  reveal?: RevealVariant;
  delay?: number;
  parallax?: "hanging" | "floor";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const outer: React.CSSProperties = {
    position: "absolute",
    left: u(clip[0]),
    top: u(clip[1]),
    width: u(clip[2]),
    height: u(clip[3]),
    overflow: "hidden",
    clipPath,
    pointerEvents: "none",
    ...style,
  };
  const inner = (
    <div
      style={{
        position: "absolute",
        left: u(img[0] - clip[0]),
        top: u(img[1] - clip[1]),
        width: u(img[2]),
        height: u(img[3]),
        transform:
          [flipX ? "scaleX(-1)" : "", rotate ? `rotate(${rotate}deg)` : ""].join(" ").trim() ||
          undefined,
      }}
    >
      {children}
    </div>
  );
  if (!reveal) {
    return (
      <div className={className} style={outer} data-parallax={parallax}>
        {inner}
      </div>
    );
  }
  if (parallax) {
    // Parallax menggeser KOTAK POTONG (properti CSS `translate`, terpisah dari
    // transform animasi masuk) agar tepi potongan gambar tidak pernah terlihat.
    return (
      <div className={className} style={outer} data-parallax={parallax}>
        <Reveal variant={reveal} delay={delay} style={{ position: "absolute", inset: 0 }}>
          {inner}
        </Reveal>
      </div>
    );
  }
  return (
    <Reveal variant={reveal} delay={delay} className={className} style={outer}>
      {inner}
    </Reveal>
  );
}

/** Pembungkus section kanvas: container-type agar cqw = lebar section. */
export function canvasSectionStyle(height: number | null, bg: string): React.CSSProperties {
  return {
    position: "relative",
    width: "100%",
    aspectRatio: height ? `${CANVAS_W} / ${height}` : undefined,
    overflow: "hidden",
    containerType: "inline-size",
    backgroundColor: bg,
    userSelect: "none",
    WebkitUserSelect: "none",
    // kanvas tidak memakai content-visibility (posisi absolut dihitung dari aspect-ratio)
    contentVisibility: "visible",
  };
}
