"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AssetImg, useSlotAsset } from "../_shared/assets";
import { useInvitation } from "../_shared/runtime/context";
import { SectionShell } from "../_shared/runtime/SectionShell";
import type { SectionId } from "@/schemas/sections";

/**
 * Sistem kanvas Renda Rimba: desain referensi memakai kanvas selebar 430 px.
 * `u(px)` → satuan cqw (section memakai container-type: inline-size), jadi
 * koordinat di file tema ini = koordinat px desain asli.
 */
export const CANVAS_W = 430;
export const u = (px: number) => `${((px / CANVAS_W) * 100).toFixed(4)}cqw`;

export const F = {
  sans: "var(--rr-sans), 'Jost', sans-serif",
  brush: "var(--rr-brush), 'Caveat Brush', cursive",
  hand: "var(--rr-hand), 'Caveat', cursive",
  script: "var(--rr-script), 'Great Vibes', cursive",
  elegant: "var(--rr-elegant), 'Parisienne', cursive",
  casual: "var(--rr-casual), 'Kaushan Script', cursive",
  serif: "var(--rr-serif), 'Cormorant Garamond', serif",
  body: "var(--rr-body), 'Lora', Georgia, serif",
  arabic: "var(--rr-arabic), 'Amiri', serif",
} as const;

/** Gaya teks dalam satuan kanvas. */
export function txt(
  font: string,
  size: number,
  lh: number | string,
  o: {
    color?: string;
    ls?: number;
    weight?: number;
    italic?: boolean;
    align?: React.CSSProperties["textAlign"];
  } = {},
): React.CSSProperties {
  // tanpa `margin` (preflight Tailwind sudah 0) agar margin pemanggil tidak tertimpa
  return {
    fontFamily: font,
    fontSize: u(size),
    // < 4 = pengali (1.25), selain itu px kanvas (38)
    lineHeight: typeof lh === "number" ? (lh < 4 ? String(lh) : u(lh)) : lh,
    letterSpacing: o.ls ? u(o.ls) : undefined,
    fontWeight: o.weight ?? 400,
    fontStyle: o.italic ? "italic" : undefined,
    color: o.color ?? "var(--inv-cream)",
    textAlign: o.align ?? "center",
  };
}

/** Kotak absolut dalam koordinat kanvas. */
export function box(l: number, t: number, w?: number, h?: number): React.CSSProperties {
  return {
    position: "absolute",
    left: u(l),
    top: u(t),
    width: w === undefined ? undefined : u(w),
    height: h === undefined ? undefined : u(h),
  };
}

/**
 * Gambar slot (file asli status milik/free) atau pengganti SVG.
 * `w` = lebar tampil dalam px kanvas → atribut sizes next/image yang tepat.
 */
export function Art({
  slot,
  fallback,
  w = CANVAS_W,
  fit = "contain",
  priority,
  filter,
  position,
}: {
  slot: string;
  fallback: React.ReactNode;
  w?: number;
  fit?: "fill" | "cover" | "contain";
  priority?: boolean;
  filter?: string;
  position?: string;
}) {
  const img = useSlotAsset(undefined, slot);
  if (img) {
    const vw = Math.min(100, Math.round((w / CANVAS_W) * 100));
    return (
      <AssetImg
        image={img}
        mode="fill"
        fit={fit}
        priority={priority}
        sizes={`(max-width: 440px) ${vw}vw, ${Math.round(w)}px`}
        style={{ filter, objectPosition: position }}
      />
    );
  }
  return <div style={{ position: "absolute", inset: 0, filter }}>{fallback}</div>;
}

/** Gambar slot pada kotak kanvas; tinggi dari rasio file (atau `ratio` cadangan). */
export function Pic({
  slot,
  fallback,
  l,
  t,
  w,
  ratio,
  flip,
  rotate,
  origin,
  a,
  d,
  sway,
  style,
  priority,
  z,
}: {
  slot: string;
  fallback: React.ReactNode;
  l: number;
  t: number;
  w: number;
  /** tinggi / lebar bila slot tidak punya file. */
  ratio: number;
  flip?: boolean;
  rotate?: number;
  origin?: string;
  /** Animasi masuk (data-a di theme.css, mis. "soft") + jedanya (detik). */
  a?: string;
  d?: number;
  /** Goyang bunga: "hang" (poros atas) atau "stand" (poros bawah). */
  sway?: "hang" | "stand";
  style?: React.CSSProperties;
  priority?: boolean;
  z?: number;
}) {
  const img = useSlotAsset(undefined, slot);
  const r = img ? img.height / img.width : ratio;
  const inner = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform:
          [flip ? "scaleX(-1)" : "", rotate ? `rotate(${rotate}deg)` : ""].join(" ").trim() ||
          undefined,
        transformOrigin: origin,
      }}
    >
      <Art slot={slot} w={w} priority={priority} fallback={fallback} />
    </div>
  );
  return (
    <div
      aria-hidden
      data-a={a}
      style={{
        ...box(l, t, w, w * r),
        pointerEvents: "none",
        zIndex: z,
        ...(d ? { ["--d" as string]: `${d}s` } : null),
        ...style,
      }}
    >
      {sway ? (
        <div
          className={`rr-sway rr-sway-${sway}`}
          style={{
            position: "absolute",
            inset: 0,
            // tempo berbeda per bunga (seperti desain: 4,2–6,6 s, fase acak)
            ["--fdur" as string]: `${(4.2 + (Math.abs(l + t) % 24) / 10).toFixed(2)}s`,
            ["--fdly" as string]: `${(-(Math.abs(l * 7 + t) % 40) / 10).toFixed(2)}s`,
          }}
        >
          {inner}
        </div>
      ) : (
        inner
      )}
    </div>
  );
}

/**
 * Section kanvas. Animasi masuk berbasis CSS: kelas `rr-in` dipasang sekali
 * saat section terlihat; elemen ber-kelas `rr-a-*` menunggu kelas itu
 * (lihat theme.css). Section memakai content-visibility: visible karena
 * bunga boleh menjuntai melewati batas section.
 */
export function Section({
  id,
  height,
  minHeight,
  bg = "var(--inv-bg)",
  z = 1,
  overflow = "visible",
  threshold = 0.2,
  className,
  style,
  children,
}: {
  id: SectionId;
  height?: number;
  minHeight?: number;
  bg?: string;
  z?: number;
  overflow?: "visible" | "hidden" | "clip";
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Section disiapkan di balik cover (prepareBehindCover): animasi masuk baru
  // dimulai setelah cover dibuka.
  const { opened } = useInvitation();
  const entered = useEnter(ref, threshold, opened);
  return (
    <SectionShell
      id={id}
      className={`rr-sec ${entered ? "rr-in" : ""} ${className ?? ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: height ? u(height) : undefined,
        minHeight: minHeight ? u(minHeight) : undefined,
        containerType: "inline-size",
        background: bg,
        overflow,
        zIndex: z,
        contentVisibility: "visible",
        ...style,
      }}
    >
      <div ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      {children}
    </SectionShell>
  );
}

/** true sekali setelah elemen terlihat (threshold), tidak kembali false. */
export function useEnter(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.2,
  enabled = true,
): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on || !enabled) return;
    if (!("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, on, enabled]);
  return on;
}

/**
 * Kecilkan teks satu baris bila lebih lebar dari kotaknya (nama panjang).
 * Elemen memakai `font-size: calc(ukuran * var(--fit, 1))`; hook ini mengisi
 * --fit langsung di DOM (tanpa render ulang), diukur lagi setelah font dimuat.
 */
export function useFit<T extends HTMLElement>(key: string, limit = 1) {
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      const need = el.scrollWidth;
      const have = el.clientWidth * limit;
      if (need > have + 1)
        el.style.setProperty("--fit", Math.max(0.5, (have / need) * 0.98).toFixed(3));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [key, limit]);
  return ref;
}

export const fitSize = (size: number) => `calc(${u(size)} * var(--fit, 1))`;

/** Garis ornamen ❦ di antara dua garis tipis. */
export function Fleuron({
  color,
  line,
  width = 86,
  dotted,
  margin = 12,
  className,
}: {
  color: string;
  line: string;
  width?: number;
  dotted?: boolean;
  margin?: number;
  className?: string;
}) {
  const rule: React.CSSProperties = {
    width: u(width),
    borderTop: `1px ${dotted ? "dotted" : "solid"} ${line}`,
  };
  return (
    <p
      aria-hidden
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: u(8),
        margin: `${u(margin)} 0`,
        color,
        fontSize: u(13),
        lineHeight: 1,
      }}
    >
      <span style={rule} />❦<span style={rule} />
    </p>
  );
}
