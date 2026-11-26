"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Tombol header. Halaman website sengaja STATIS (cepat & bisa di-cache CDN),
 * jadi status login dicek di browser setelah halaman tampil: default "Masuk" +
 * "Pilih tema"; bila sesi ada → "Dashboard" (admin) / "Undangan saya" (pembeli).
 */
export function AuthButtons() {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch("/api/auth/session", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((s: { user?: { role?: string } } | null) => alive && setRole(s?.user?.role ?? null))
        .catch(() => alive && setRole(null));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(check);
    else setTimeout(check, 200);
    return () => {
      alive = false;
    };
  }, []);

  if (role)
    return (
      <Button asChild size="sm" className="rounded-full px-4">
        <Link href={role === "CUSTOMER" ? "/akun" : "/dashboard"}>
          {role === "CUSTOMER" ? "Undangan saya" : "Dashboard"}
        </Link>
      </Button>
    );
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex">
        <Link href="/masuk">Masuk</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full px-4 shadow-sm">
        <Link href="/tema">Pilih tema</Link>
      </Button>
    </div>
  );
}
