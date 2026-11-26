"use client";

import { useEffect } from "react";

/**
 * Dialog/menu/tooltip shadcn dirender lewat portal ke <body> — di luar
 * pembungkus font website. Variabel font dipasang juga di <html> selama
 * halaman website terbuka (dilepas lagi saat pindah ke halaman undangan).
 */
export function FontVarsOnHtml({ className }: { className: string }) {
  useEffect(() => {
    const cls = className.split(/\s+/).filter(Boolean);
    document.documentElement.classList.add(...cls);
    return () => document.documentElement.classList.remove(...cls);
  }, [className]);
  return null;
}
