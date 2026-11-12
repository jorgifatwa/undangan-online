"use client";

import { useEffect } from "react";

/**
 * ?focus=<sectionId>: gulir ke section itu begitu dirender (dipakai iframe
 * /preview/banding). Section dirender di client, jadi dicoba ulang sebentar.
 */
export function PreviewFocus({ section }: { section: string }) {
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(`inv-${section}`);
      if (el || ++tries > 50) window.clearInterval(id);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    }, 100);
    return () => window.clearInterval(id);
  }, [section]);
  return null;
}
