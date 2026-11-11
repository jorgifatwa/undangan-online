"use client";

import { useCallback, useEffect, useState } from "react";

import { useInvitation } from "../runtime/context";

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true jika target sudah lewat. */
  done: boolean;
  /** false pada render server/awal (hindari mismatch hidrasi). */
  ready: boolean;
}

/** Hitung mundur per detik ke `target`. Interval berhenti saat tab tidak aktif. */
export function useCountdown(target: Date): CountdownValue {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let id: number | undefined;
    const start = () => {
      setNow(Date.now());
      id = window.setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => window.clearInterval(id);
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (now === null) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false, ready: false };
  const diff = Math.max(0, target.getTime() - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff === 0,
    ready: true,
  };
}

/** Salin teks ke clipboard + toast tema. */
export function useCopy() {
  const { showToast } = useInvitation();
  return useCallback(
    async (text: string, label = "Disalin") => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback untuk WebView lama (mis. browser bawaan WhatsApp).
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      showToast(`${label} ✓`);
    },
    [showToast],
  );
}

/** "62812..." → link wa.me */
export function whatsappLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
