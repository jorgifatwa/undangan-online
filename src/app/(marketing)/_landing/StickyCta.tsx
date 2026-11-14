"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** HP: bar tombol di bawah layar setelah hero terlewati (sembunyi lagi di CTA penutup). */
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    const end = document.getElementById("cta-akhir");
    if (!hero || !("IntersectionObserver" in window)) return;
    const state = { pastHero: false, atEnd: false };
    const update = () => setShow(state.pastHero && !state.atEnd);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) state.pastHero = !e.isIntersecting;
        if (e.target === end) state.atEnd = e.isIntersecting;
      }
      update();
    });
    io.observe(hero);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, []);
  return (
    <div
      className={cn(
        "bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!show}
    >
      <Link
        href="/masuk"
        tabIndex={show ? 0 : -1}
        className="bg-primary text-primary-foreground block rounded-full py-3 text-center font-medium"
      >
        Buat Undangan Gratis
      </Link>
    </div>
  );
}
