"use client";

import { useEffect } from "react";

import { PetalRain } from "../_shared/effects/Petals";
import { useInvitation } from "../_shared/runtime/context";

/**
 * Lapisan efek Tirai Beludru:
 *  - hujan kelopak sakura di atas undangan setelah amplop dibuka
 *    (mulai dari atas layar, setelah semburan dari amplop);
 *  - parallax bunga: bunga gantung bergeser naik di separuh atas layar, bunga
 *    lantai turun di separuh bawah (tepi potongnya tidak pernah terlihat).
 *    Mati di mode ringan & prefers-reduced-motion.
 */
export function TiraiAmbient({ opened }: { opened: boolean }) {
  const { lite } = useInvitation();

  useEffect(() => {
    if (!opened || lite || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Rumus desain referensi (ParallaxObserver): kedalaman 0,08; posisi dihitung
    // tanpa offset sebelumnya; elemen jauh di luar layar dilewati. Baca semua
    // posisi dulu, baru tulis (satu kali layout).
    const DEPTH = 0.08;
    const offsets = new WeakMap<HTMLElement, number>();
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const els = [
        ...document.querySelectorAll<HTMLElement>('[data-theme="tirai-beludru"] [data-parallax]'),
      ];
      const next = els.map((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return null;
        const d = r.top + r.height / 2 - (offsets.get(el) ?? 0) - vh / 2;
        return el.dataset.parallax === "hanging" ? Math.min(0, d) * DEPTH : Math.max(0, d) * DEPTH;
      });
      els.forEach((el, i) => {
        const off = next[i];
        if (off === null || off === offsets.get(el)) return;
        offsets.set(el, off);
        el.style.translate = `0 ${off.toFixed(1)}px`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [opened, lite]);

  if (!opened) return null;
  return <PetalRain count={9} lite={lite} enterFromTop className="z-20" />;
}
