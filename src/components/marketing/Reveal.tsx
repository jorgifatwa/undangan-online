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
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.setAttribute("data-shown", "");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
