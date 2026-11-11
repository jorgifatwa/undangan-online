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

const VARIANTS: Record<RevealVariant, VariantDef> = {
  fade: { hidden: { opacity: 0 }, duration: 0.8, ease: EASE_SOFT },
  zoom: { hidden: { opacity: 0, scale: 0.92 }, duration: 0.9, ease: EASE_SOFT },
  left: { hidden: { opacity: 0, x: -36 }, duration: 0.9, ease: EASE_SOFT },
  right: { hidden: { opacity: 0, x: 36 }, duration: 0.9, ease: EASE_SOFT },
  rise: { hidden: { opacity: 0, y: 40 }, duration: 0.9, ease: EASE_SOFT },
  drop: { hidden: { opacity: 0, y: -30 }, duration: 0.9, ease: EASE_SOFT },
  sway: {
    hidden: { opacity: 0, rotate: -6 },
    duration: 1.4,
    ease: EASE_SOFT,
    transformOrigin: "50% 0%",
  },
  "sway-right": {
    hidden: { opacity: 0, rotate: 6 },
    duration: 1.4,
    ease: EASE_SOFT,
    transformOrigin: "50% 0%",
  },
  pop: { hidden: { opacity: 0, scale: 0.4 }, duration: 0.7, ease: EASE_BACK },
  blur: { hidden: { opacity: 0, filter: "blur(10px)" }, duration: 1.2, ease: EASE_SOFT },
  swing: {
    hidden: { opacity: 0, rotate: -14 },
    duration: 1.1,
    ease: EASE_BACK,
    transformOrigin: "0% 50%",
  },
  flip: { hidden: { opacity: 0, rotateX: 80 }, duration: 0.9, ease: EASE_SOFT },
  wipe: { hidden: { clipPath: "inset(0 100% 0 0)" }, duration: 1, ease: EASE_SOFT },
  "tilt-left": { hidden: { opacity: 0, x: -24, rotate: -4 }, duration: 1, ease: EASE_SOFT },
  "tilt-right": { hidden: { opacity: 0, x: 24, rotate: 4 }, duration: 1, ease: EASE_SOFT },
  "popup-up": {
    hidden: { opacity: 0, scaleY: 0.05 },
    duration: 0.8,
    ease: EASE_BACK,
    transformOrigin: "50% 100%",
  },
  "popup-left": {
    hidden: { opacity: 0, rotateY: 90 },
    duration: 0.8,
    ease: EASE_BACK,
    transformOrigin: "100% 100%",
  },
  "popup-right": {
    hidden: { opacity: 0, rotateY: -90 },
    duration: 0.8,
    ease: EASE_BACK,
    transformOrigin: "0% 100%",
  },
  "popup-ground": {
    hidden: { opacity: 0, scaleX: 0.2 },
    duration: 0.7,
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
