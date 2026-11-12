"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { GuestbookInput, GuestbookStats } from "@/lib/guestbook/schema";

import type { WishItem } from "./context";

/**
 * Buku tamu (RSVP + ucapan) untuk SEMUA tema.
 *  - Halaman publik (slug ada, bukan preview): kirim ke /api/u/{slug}/guestbook,
 *    ucapan baru diambil lewat polling ringan (15 dtk) HANYA saat section
 *    ucapan/RSVP terlihat dan tab aktif.
 *  - Preview & editor: tetap lokal (tidak menyimpan apa pun).
 */
export type SubmitPayload = Omit<GuestbookInput, "startedAt" | "website"> & { website?: string };
/** `soft` = batas kiriman tercapai: tampilkan sebagai pemberitahuan ramah, bukan error. */
type SubmitResult = { ok: true } | { ok: false; error: string; soft?: boolean };

interface GuestbookCtx {
  wishes: WishItem[];
  stats: GuestbookStats;
  /** true = tersambung ke server (halaman publik). */
  live: boolean;
  submit: (p: SubmitPayload) => Promise<SubmitResult>;
}

const POLL_MS = 15_000;
const Ctx = createContext<GuestbookCtx | null>(null);

function localStats(wishes: WishItem[]): GuestbookStats {
  const c = (a: WishItem["attendance"]) => wishes.filter((w) => w.attendance === a).length;
  return {
    hadir: c("HADIR"),
    tidakHadir: c("TIDAK_HADIR"),
    ragu: c("RAGU"),
    orang: c("HADIR"),
    ucapan: wishes.length,
  };
}

export function GuestbookProvider({
  slug,
  live,
  initialWishes,
  initialStats,
  children,
}: {
  slug: string | null;
  live: boolean;
  initialWishes: WishItem[];
  initialStats?: GuestbookStats;
  children: React.ReactNode;
}) {
  const [wishes, setWishes] = useState<WishItem[]>(initialWishes);
  const [serverStats, setServerStats] = useState<GuestbookStats | undefined>(initialStats);
  /** Waktu formulir mulai tampil (anti-bot: kiriman < 3 dtk dianggap bot). */
  const startedAt = useRef(Date.now());
  const merge = useCallback((incoming: WishItem[]) => {
    setWishes((cur) => {
      const seen = new Set(cur.map((w) => w.id ?? `${w.name}|${w.createdAt}`));
      const fresh = incoming.filter((w) => !seen.has(w.id ?? `${w.name}|${w.createdAt}`));
      return fresh.length ? [...fresh, ...cur] : cur;
    });
  }, []);

  const wishesRef = useRef(wishes);
  useEffect(() => {
    wishesRef.current = wishes;
  }, [wishes]);

  // Polling ucapan baru (hemat: hanya saat section terlihat & tab aktif).
  useEffect(() => {
    if (!live || !slug) return;
    const tick = async () => {
      if (document.hidden) return;
      if (
        !document.querySelector(
          '[data-inv-section="ucapan"][data-inview], [data-inv-section="rsvp"][data-inview]',
        )
      )
        return;
      const newest = wishesRef.current[0]?.createdAt;
      try {
        const r = await fetch(
          `/api/u/${encodeURIComponent(slug)}/wishes${newest ? `?after=${encodeURIComponent(newest)}` : ""}`,
          {
            cache: "no-store",
          },
        );
        if (!r.ok) return;
        const j = (await r.json()) as { wishes: WishItem[]; stats: GuestbookStats };
        merge(j.wishes);
        setServerStats(j.stats);
      } catch {
        /* jaringan putus: coba lagi di putaran berikut */
      }
    };
    const t = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(t);
  }, [live, slug, merge]);

  const submit = useCallback(
    async (p: SubmitPayload): Promise<SubmitResult> => {
      if (!live || !slug) {
        // Preview: hanya lokal
        if (p.message)
          setWishes((w) => [
            {
              name: p.name.trim(),
              message: p.message!.trim(),
              attendance: p.attendance,
              createdAt: new Date().toISOString(),
            },
            ...w,
          ]);
        return { ok: true };
      }
      try {
        const r = await fetch(`/api/u/${encodeURIComponent(slug)}/guestbook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, startedAt: startedAt.current }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          wish?: WishItem | null;
          stats?: GuestbookStats;
          error?: string;
          rateLimited?: boolean;
        };
        if (!r.ok)
          return {
            ok: false,
            error: j.error ?? "Gagal mengirim. Coba lagi.",
            soft: r.status === 429 || j.rateLimited,
          };
        if (j.wish) merge([j.wish]);
        if (j.stats) setServerStats(j.stats);
        return { ok: true };
      } catch {
        return { ok: false, error: "Koneksi terputus. Periksa internet lalu coba lagi." };
      }
    },
    [live, slug, merge],
  );

  const value = useMemo<GuestbookCtx>(
    () => ({ wishes, stats: live && serverStats ? serverStats : localStats(wishes), live, submit }),
    [wishes, serverStats, live, submit],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuestbook(): GuestbookCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGuestbook di luar ThemeRoot");
  return c;
}

/** Input honeypot tersembunyi (bot mengisinya, manusia tidak melihatnya). */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
    >
      <label>
        Situs web
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
