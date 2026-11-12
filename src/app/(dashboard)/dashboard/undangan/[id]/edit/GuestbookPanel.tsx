"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import type { GuestbookStats } from "@/lib/guestbook/schema";
import { cn } from "@/lib/utils";

import {
  deleteRsvpAction,
  deleteWishAction,
  guestbookAction,
  hideWishAction,
} from "./guestbook-actions";

type Data = Extract<Awaited<ReturnType<typeof guestbookAction>>, { ok: true }>;
const STATUS = { HADIR: "Hadir", TIDAK_HADIR: "Tidak hadir", RAGU: "Ragu" } as const;
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Rekap RSVP + moderasi ucapan (pemilik). Dimuat saat grup dibuka. */
export function GuestbookPanel({ invitationId }: { invitationId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"ucapan" | "rsvp">("ucapan");
  const [pending, start] = useTransition();

  const load = useCallback(() => {
    start(async () => {
      const r = await guestbookAction(invitationId);
      if (r.ok) setData(r);
      else setError(r.error);
    });
  }, [invitationId]);
  useEffect(load, [load]);

  const act = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      await fn();
      const r = await guestbookAction(invitationId);
      if (r.ok) setData(r);
    });

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) return <p className="text-muted-foreground text-sm">Memuat…</p>;
  const s: GuestbookStats = data.stats;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 text-center" aria-label="Rekap kehadiran">
        {[
          ["Hadir", s.hadir, `${s.orang} orang`],
          ["Tidak hadir", s.tidakHadir, ""],
          ["Ragu", s.ragu, ""],
          ["Ucapan", s.ucapan, "tampil"],
        ].map(([l, n, sub]) => (
          <div key={l as string} className="rounded-xl border bg-white px-1 py-2">
            <p className="font-heading text-2xl">{n}</p>
            <p className="text-xs">{l}</p>
            {sub && <p className="text-muted-foreground text-[11px]">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm" role="tablist">
        {(["ucapan", "rsvp"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1",
              tab === t ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
            )}
          >
            {t === "ucapan"
              ? `Ucapan (${data.wishes.length})`
              : `Konfirmasi (${data.rsvps.length})`}
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="text-primary ml-auto text-xs"
        >
          {pending ? "Memuat…" : "↻ Muat ulang"}
        </button>
      </div>

      {tab === "ucapan" ? (
        data.wishes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada ucapan.</p>
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {data.wishes.map((w) => (
              <li
                key={w.id}
                data-wish-id={w.id}
                className={cn("rounded-xl border bg-white p-3 text-sm", w.isHidden && "opacity-60")}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    {w.name}
                    {w.attendance && (
                      <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                        · {STATUS[w.attendance]}
                      </span>
                    )}
                    {w.isHidden && (
                      <span className="ml-1.5 rounded bg-neutral-200 px-1.5 text-[11px] font-normal">
                        disembunyikan
                      </span>
                    )}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {fmt(w.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line">{w.message}</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <button
                    type="button"
                    className="text-primary"
                    disabled={pending}
                    onClick={() => act(() => hideWishAction(invitationId, w.id, !w.isHidden))}
                  >
                    {w.isHidden ? "Tampilkan" : "Sembunyikan"}
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      window.confirm(`Hapus ucapan dari ${w.name}?`) &&
                      act(() => deleteWishAction(invitationId, w.id))
                    }
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : data.rsvps.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada konfirmasi kehadiran.</p>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs">
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Orang</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.rsvps.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {r.name}
                    <span className="text-muted-foreground block text-[11px]">
                      {fmt(r.createdAt)}
                    </span>
                  </td>
                  <td className="px-2 py-2">{STATUS[r.status]}</td>
                  <td className="px-2 py-2 text-right">{r.status === "HADIR" ? r.pax : "—"}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive text-xs"
                      onClick={() =>
                        window.confirm(`Hapus konfirmasi ${r.name}?`) &&
                        act(() => deleteRsvpAction(invitationId, r.id))
                      }
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
