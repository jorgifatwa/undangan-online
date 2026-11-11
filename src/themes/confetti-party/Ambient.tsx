"use client";

import { useEffect, useRef } from "react";

import { Confetti, type ConfettiHandle } from "../_shared/effects/Confetti";
import { useInvitation } from "../_shared/runtime/context";

const COLORS = ["#ff4f8b", "#ffc93c", "#3ec5f0", "#7c5cff", "#5be39b", "#ffffff"];

/** Hujan konfeti saat cover dibuka (dua ledakan dari kiri & kanan bawah + satu dari tengah). */
export function ConfettiAmbient({ opened }: { opened: boolean }) {
  const { lite } = useInvitation();
  const ref = useRef<ConfettiHandle | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!opened || fired.current) return;
    fired.current = true;
    const n = lite ? 40 : 110;
    const w = Math.min(window.innerWidth, 440);
    const h = window.innerHeight;
    ref.current?.burst({ x: w * 0.1, y: h * 0.85, count: n, spread: 0.6 });
    const t1 = window.setTimeout(
      () => ref.current?.burst({ x: w * 0.9, y: h * 0.85, count: n, spread: 0.6 }),
      180,
    );
    const t2 = lite
      ? undefined
      : window.setTimeout(
          () => ref.current?.burst({ x: w * 0.5, y: h * 0.3, count: 80, spread: 1.6 }),
          420,
        );
    return () => {
      window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
  }, [opened, lite]);

  return <Confetti ref={ref} colors={COLORS} className="absolute inset-0 z-30" />;
}
