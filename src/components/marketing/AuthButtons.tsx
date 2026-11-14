"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Tombol header. Halaman website sengaja STATIS (cepat & bisa di-cache CDN),
 * jadi status login dicek di browser setelah halaman tampil: default "Masuk" +
 * "Buat Undangan Gratis", berganti "Dashboard" bila sesi ada.
 */
export function AuthButtons({ compact = false }: { compact?: boolean }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch("/api/auth/session", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((s: { user?: unknown } | null) => alive && setLoggedIn(!!s?.user))
        .catch(() => alive && setLoggedIn(false));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(check);
    else setTimeout(check, 200);
    return () => {
      alive = false;
    };
  }, []);

  if (loggedIn)
    return (
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium shadow-sm"
      >
        Dashboard
      </Link>
    );
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/masuk" className="hover:bg-sand rounded-full px-3 py-2 text-sm font-medium">
        Masuk
      </Link>
      <Link
        href="/masuk"
        className={cn(
          "bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:-translate-y-px",
          compact && "px-3",
        )}
      >
        <span className="sm:hidden">Buat Gratis</span>
        <span className="hidden sm:inline">Buat Undangan Gratis</span>
      </Link>
    </div>
  );
}
