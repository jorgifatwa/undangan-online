"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { useLite } from "../runtime/context";

/**
 * Animasi masuk saat discroll (terjemahan sistem data-reveal Tirai Beludru
 * dari CSS + IntersectionObserver ke Framer Motion).
 * - Hanya sekali per elemen (viewport once).
 * - prefers-reduced-motion → MotionConfig di ThemeRoot mematikannya.
 * - Mode ringan → efek blur diganti fade biasa & durasi dipersingkat.
 */

export type RevealVariant =
  | "fade"
  | "zoom"
  | "left"
  | "right"
  | "rise"
  | "drop"
  | "sway"
  | "sway-right"
  | "pop"
  | "blur"
  | "swing"
  | "flip"
  | "wipe"
  | "tilt-left"
  | "tilt-right"
  | "popup-up"
  | "popup-left"
  | "popup-right"
  | "popup-ground";

const EASE_SOFT = [0.22, 0.7, 0.2, 1] as const;
const EASE_BACK = [0.34, 1.56, 0.64, 1] as const;

interface VariantDef {
  hidden: TargetAndTransition;
  /** Durasi detik & easing. */
  duration: number;
  ease: readonly number[];
  transformOrigin?: string;
}

/**
 * Nilai mengikuti CSS reveal desain Tirai Beludru (data-reveal di referensi):
 * default naik 18 px; kiri/kanan 12%; rise 44 px; drop −36 px; sway −14 px +
 * putar ±7° dari tepi atas (1,4 s); pop skala 0,4 + putar −14° (pegas);
 * blur skala 1,08 + blur 8 px (1,2 s); swing −20 px, skala 0,85, putar −10°;
 * flip rotateX 80°; wipe skala-X 0; tilt naik 26 px, skala 0,84, putar ±6°;
 * popup-* = buku pop-up (rotateX/rotateY 88° → 0, pegas 1,5 s).
 */
const EASE_SWING = [0.34, 1.4, 0.64, 1] as const;
const EASE_POPUP = [0.3, 1.3, 0.6, 1] as const;

const VARIANTS: Record<RevealVariant, VariantDef> = {
  fade: { hidden: { opacity: 0, y: 18 }, duration: 0.9, ease: EASE_SOFT },
  zoom: { hidden: { opacity: 0, scale: 0.94 }, duration: 0.9, ease: EASE_SOFT },
  left: { hidden: { opacity: 0, x: "-12%" }, duration: 0.9, ease: EASE_SOFT },
  right: { hidden: { opacity: 0, x: "12%" }, duration: 0.9, ease: EASE_SOFT },
  rise: { hidden: { opacity: 0, y: 44 }, duration: 0.9, ease: EASE_SOFT },
  drop: { hidden: { opacity: 0, y: -36 }, duration: 0.9, ease: EASE_SOFT },
  sway: {
    hidden: { opacity: 0, y: -14, rotate: -7 },
    duration: 1.4,
    ease: EASE_SOFT,
    transformOrigin: "50% 0%",
  },
  "sway-right": {
    hidden: { opacity: 0, y: -14, rotate: 7 },
    duration: 1.4,
    ease: EASE_SOFT,
    transformOrigin: "50% 0%",
  },
  pop: { hidden: { opacity: 0, scale: 0.4, rotate: -14 }, duration: 0.9, ease: EASE_BACK },
  blur: {
    hidden: { opacity: 0, scale: 1.08, filter: "blur(8px)" },
    duration: 1.2,
    ease: EASE_SOFT,
  },
  swing: {
    hidden: { opacity: 0, x: -20, scale: 0.85, rotate: -10 },
    duration: 1.1,
    ease: EASE_SWING,
  },
  flip: { hidden: { opacity: 0, rotateX: 80 }, duration: 1, ease: EASE_SOFT },
  wipe: { hidden: { opacity: 0, scaleX: 0 }, duration: 0.9, ease: EASE_SOFT },
  "tilt-left": {
    hidden: { opacity: 0, y: 26, scale: 0.84, rotate: -6 },
    duration: 0.9,
    ease: EASE_SOFT,
  },
  "tilt-right": {
    hidden: { opacity: 0, y: 26, scale: 0.84, rotate: 6 },
    duration: 0.9,
    ease: EASE_SOFT,
  },
  "popup-up": {
    hidden: { opacity: 0, rotateX: -88 },
    duration: 1.5,
    ease: EASE_POPUP,
    transformOrigin: "50% 100%",
  },
  "popup-left": {
    hidden: { opacity: 0, rotateY: 88 },
    duration: 1.5,
    ease: EASE_POPUP,
    transformOrigin: "100% 70%",
  },
  "popup-right": {
    hidden: { opacity: 0, rotateY: -88 },
    duration: 1.5,
    ease: EASE_POPUP,
    transformOrigin: "0% 70%",
  },
  "popup-ground": {
    hidden: { opacity: 0, scaleX: 0.15 },
    duration: 1.3,
    ease: EASE_SOFT,
    transformOrigin: "50% 100%",
  },
};

const VISIBLE: TargetAndTransition = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  filter: "blur(0px)",
  clipPath: "inset(0 0% 0 0)",
};

export interface RevealProps {
  variant?: RevealVariant;
  /** Jeda tambahan (detik). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  as?: "div" | "p" | "span" | "h2" | "h3" | "li";
  /** Porsi elemen yang harus terlihat sebelum animasi mulai. */
  amount?: number;
}

export function Reveal({
  variant = "rise",
  delay = 0,
  className,
  style,
  children,
  as = "div",
  amount = 0.25,
}: RevealProps) {
  const lite = useLite();
  const def = VARIANTS[lite && variant === "blur" ? "fade" : variant];
  const Component = motion[as];

  // Hanya properti yang dipakai varian yang dianimasikan (hindari filter/clipPath tak perlu).
  const visible = Object.fromEntries(
    Object.keys(def.hidden).map((k) => [k, VISIBLE[k as keyof TargetAndTransition]]),
  ) as TargetAndTransition;

  return (
    <Component
      className={className}
      style={{ ...style, transformOrigin: def.transformOrigin ?? style?.transformOrigin }}
      initial={def.hidden}
      whileInView={visible}
      viewport={{ once: true, amount }}
      transition={{
        duration: lite ? def.duration * 0.7 : def.duration,
        ease: def.ease as [number, number, number, number],
        delay,
      }}
    >
      {children}
    </Component>
  );
}
