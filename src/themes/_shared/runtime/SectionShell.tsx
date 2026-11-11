"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { SectionId } from "@/schemas/sections";

/**
 * Pembungkus setiap section. Memberi atribut data-inview saat section dekat
 * layar; CSS runtime menghentikan animasi berulang di section yang tidak
 * terlihat. Komponen efek bisa membaca atribut yang sama.
 */
export function SectionShell({
  id,
  className,
  style,
  children,
}: {
  id: SectionId;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.setAttribute("data-inview", "");
        else el.removeAttribute("data-inview");
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={`inv-${id}`}
      data-inv-section={id}
      className={cn("inv-section", `inv-section-${id}`, className)}
      style={style}
    >
      {children}
    </section>
  );
}
