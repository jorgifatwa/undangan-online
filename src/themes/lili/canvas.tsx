"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useInvitation } from "../_shared/runtime/context";
import { SectionShell } from "../_shared/runtime/SectionShell";
import type { SectionId } from "@/schemas/sections";

/**
 * Kanvas Lili: layar desain referensi selebar 900 px screenshot → 430 px
 * kanvas (skala 0,4778). `u(px)` → cqw (section memakai container-type:
 * inline-size), jadi angka di file tema = px kanvas 430.
 */
export const CANVAS_W = 430;
export const u = (px: number) => `${((px / CANVAS_W) * 100).toFixed(4)}cqw`;

export const F = {
  serif: "var(--li-serif), 'Playfair Display', Georgia, serif",
  script: "var(--li-script), 'Pinyon Script', cursive",
  amp: "var(--li-amp), 'Great Vibes', cursive",
  hand: "var(--li-hand), 'Sacramento', cursive",
  arabic: "var(--li-arabic), 'Amiri', serif",
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
  return {
    fontFamily: font,
    fontSize: u(size),
    lineHeight: typeof lh === "number" ? (lh < 4 ? String(lh) : u(lh)) : lh,
    letterSpacing: o.ls ? u(o.ls) : undefined,
    fontWeight: o.weight ?? 400,
    fontStyle: o.italic ? "italic" : undefined,
    color: o.color ?? "var(--inv-ink)",
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
 * Section kanvas. Animasi masuk CSS: kelas `li-in` dipasang sekali saat
 * section terlihat (setelah cover dibuka); elemen ber-`data-a` menunggu kelas
 * itu (theme.css). content-visibility: visible karena bunga boleh melewati
 * batas section.
 */
export function Section({
  id,
  height,
  minHeight,
  bg = "var(--inv-paper)",
  z = 1,
  overflow = "visible",
  threshold = 0.15,
  className,
  style,
  groups,
  children,
}: {
  id: SectionId;
  height?: number;
  minHeight?: number;
  /** Warna latar, atau objek gaya latar (mis. `paperBg()`). */
  bg?: string | React.CSSProperties;
  z?: number;
  overflow?: "visible" | "hidden" | "clip";
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  /** true = animasi masuk dipicu per <EnterGroup> (section tinggi), bukan per section. */
  groups?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { opened } = useInvitation();
  const entered = useEnter(ref, threshold, opened && !groups);
  return (
    <SectionShell
      id={id}
      className={`li-sec ${entered ? "li-in" : ""} ${className ?? ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: height ? u(height) : undefined,
        minHeight: minHeight ? u(minHeight) : undefined,
        containerType: "inline-size",
        ...(typeof bg === "string" ? { background: bg } : bg),
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
  threshold = 0.15,
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
 * Kecilkan teks satu baris bila lebih lebar dari kotaknya (nama panjang):
 * elemen memakai `font-size: calc(ukuran * var(--fit, 1))`, hook mengisi --fit
 * langsung di DOM, diukur ulang setelah font dimuat.
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
        el.style.setProperty("--fit", Math.max(0.45, (have / need) * 0.98).toFixed(3));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [key, limit]);
  return ref;
}

/**
 * Kelompok animasi masuk di dalam section tinggi (`<Section groups>`): elemen
 * `data-a` di dalamnya baru beranimasi saat kelompok ini sendiri terlihat.
 */
export function EnterGroup({
  threshold = 0.25,
  style,
  children,
}: {
  threshold?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { opened } = useInvitation();
  const entered = useEnter(ref, threshold, opened);
  return (
    <div ref={ref} className={`li-sec ${entered ? "li-in" : ""}`} style={style}>
      {children}
    </div>
  );
}
