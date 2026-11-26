"use client";

import { useEffect } from "react";

import type { VisitKey } from "@/lib/analytics/keys";

/** Kirim satu hitungan per tab per peristiwa (sessionStorage, bukan cookie). */
export function sendVisit(key: VisitKey) {
  try {
    const flag = `undangku:hit:${key}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
  } catch {
    /* mode privat: tetap kirim */
  }
  const blob = new Blob([key], { type: "text/plain" });
  if (!navigator.sendBeacon?.("/api/hit", blob))
    void fetch("/api/hit", { method: "POST", body: key, keepalive: true }).catch(() => {});
}

/** Pasang di halaman: hitung sekali saat halaman dibuka. */
export function VisitBeacon({ k }: { k: VisitKey }) {
  useEffect(() => sendVisit(k), [k]);
  return null;
}
