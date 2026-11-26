"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Satu IntersectionObserver untuk semua [data-reveal] di halaman: tandai
 * data-shown saat elemen mendekati layar (gaya di marketing.css; otomatis
 * tanpa animasi bila prefers-reduced-motion).
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }
    // Varian "mask"/"curtain" memakai clip-path; Chrome menganggap elemen yang
    // terpotong habis "tidak terlihat" → yang diamati elemen pembungkusnya.
    const owner = new Map<Element, HTMLElement[]>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            (owner.get(e.target) ?? []).forEach((el) => el.setAttribute("data-shown", ""));
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => {
      const clipped = el.dataset.reveal === "mask" || el.dataset.reveal === "curtain";
      const target = (clipped && el.parentElement) || el;
      owner.set(target, [...(owner.get(target) ?? []), el]);
      io.observe(target);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
