"use client";

import { motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";

import { rng } from "../ornaments/geom";
import { Petal } from "../ornaments/Objects";

/**
 * Hujan kelopak sakura (CSS murni — hanya transform & opacity, dikerjakan
 * compositor). Animasi otomatis berhenti saat tab tidak aktif (runtime.css).
 * Mode ringan: jumlah kelopak dikurangi drastis (± seperempat).
 */
export function PetalRain({
  count = 14,
  lite = false,
  className,
  enterFromTop = false,
}: {
  count?: number;
  lite?: boolean;
  className?: string;
  /** true → kelopak mulai dari atas layar (bukan sudah di tengah jatuh). */
  enterFromTop?: boolean;
}) {
  const n = lite ? Math.max(2, Math.round(count / 4)) : count;
  const petals = useMemo(() => {
    const rand = rng(42);
    return Array.from({ length: 24 }, () => ({
      left: rand() * 100,
      size: 9 + rand() * 9,
      dur: 9 + rand() * 7,
      delay: rand(),
      sway: 30 + rand() * 50,
      spin: (rand() > 0.5 ? 1 : -1) * (180 + rand() * 360),
      hue: rand() > 0.75 ? 1 : 0,
    }));
  }, []);

  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        containerType: "size",
      }}
    >
      {petals.slice(0, n).map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: -30,
            left: `${p.left}%`,
            width: p.size,
            animation: `inv-petal-fall ${p.dur}s linear ${enterFromTop ? p.delay * 6 : -p.delay * p.dur}s infinite`,
            ["--sway" as string]: `${p.sway}px`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        >
          <Petal
            style={{
              width: "100%",
              animation: `inv-petal-tumble ${1.6 + p.delay * 1.5}s ease-in-out infinite alternate`,
              opacity: p.hue ? 0.75 : 0.95,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes inv-petal-fall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translate3d(var(--sway), 55cqh, 0) rotate(calc(var(--spin) * .5)); }
          100% { transform: translate3d(calc(var(--sway) * -.4), calc(100cqh + 40px), 0) rotate(var(--spin)); opacity: .9; }
        }
        @keyframes inv-petal-tumble { from { transform: scaleX(1) } to { transform: scaleX(.35) } }
      `}</style>
    </div>
  );
}

export interface PetalBurstHandle {
  /** Semburan kelopak dari titik layar (px viewport). */
  burst: (x: number, y: number) => void;
}

/**
 * Semburan kelopak (mis. dari mulut amplop): kelopak terlempar ke atas
 * membentuk kipas lalu jatuh sambil berputar. Layer position: fixed.
 */
export const PetalBurst = forwardRef<PetalBurstHandle, { count?: number }>(function PetalBurst(
  { count = 26 },
  ref,
) {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now();
      setBursts((b) => [...b, { id, x, y }]);
      window.setTimeout(() => setBursts((b) => b.filter((it) => it.id !== id)), 3200);
    },
  }));

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}>
      {bursts.map((b) => (
        <BurstGroup key={b.id} x={b.x} y={b.y} count={count} seed={b.id} />
      ))}
    </div>
  );
});

function BurstGroup({ x, y, count, seed }: { x: number; y: number; count: number; seed: number }) {
  const petals = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: count }, () => {
      const a = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 0.9; // kipas ke atas
      const v = 120 + rand() * 170;
      return {
        dx: Math.cos(a) * v,
        dy: Math.sin(a) * v,
        fall: 260 + rand() * 260,
        rot: (rand() - 0.5) * 720,
        size: 9 + rand() * 9,
        dur: 1.8 + rand() * 1.2,
      };
    });
  }, [count, seed]);

  return (
    <>
      {petals.map((p, i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", left: x, top: y, width: p.size, marginLeft: -p.size / 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: [0, p.dx, p.dx * 1.25],
            y: [0, p.dy, p.dy + p.fall],
            rotate: [0, p.rot * 0.4, p.rot],
            opacity: [0, 1, 0],
            scale: [0.4, 1, 1],
          }}
          transition={{ duration: p.dur, times: [0, 0.32, 1], ease: [0.2, 0.6, 0.4, 1] }}
        >
          <Petal style={{ width: "100%" }} />
        </motion.div>
      ))}
    </>
  );
}
