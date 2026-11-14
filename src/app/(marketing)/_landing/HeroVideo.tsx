"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video mockup HP (rekaman tema asli, `pnpm landing:record`). Gambar diam
 * tampil lebih dulu (kandidat LCP); video baru diunduh setelah halaman selesai
 * dimuat, dan TIDAK diputar bila pengguna meminta gerak dikurangi atau
 * mengaktifkan penghemat data.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    if (reduce || saveData) return;
    const start = () => setTimeout(() => setPlay(true), 400);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    if (play) void ref.current?.play().catch(() => undefined);
  }, [play]);

  if (!play) return null;
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src="/landing/hero.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
      onPlaying={(e) => e.currentTarget.setAttribute("data-playing", "")}
    />
  );
}
