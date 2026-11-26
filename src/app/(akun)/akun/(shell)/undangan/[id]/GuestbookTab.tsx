"use client";

import { toast } from "sonner";

import { GuestbookPanel } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/GuestbookPanel";
import { guestbookAction } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/guestbook-actions";

const STATUS = { HADIR: "Hadir", TIDAK_HADIR: "Tidak hadir", RAGU: "Ragu" } as const;

function csv(name: string, rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Ucapan & RSVP pembeli: rekap, moderasi (sembunyikan/hapus), unduh CSV. */
export function GuestbookTab({ invitationId, slug }: { invitationId: string; slug: string }) {
  const exportCsv = async (kind: "ucapan" | "rsvp") => {
    const r = await guestbookAction(invitationId);
    if (!r.ok) return void toast.error(r.error);
    const when = (iso: string) => new Date(iso).toLocaleString("id-ID");
    if (kind === "ucapan")
      csv(`ucapan-${slug}.csv`, [
        ["Nama", "Ucapan", "Waktu", "Disembunyikan"],
        ...r.wishes.map((w) => [w.name, w.message, when(w.createdAt), w.isHidden ? "ya" : ""]),
      ]);
    else
      csv(`rsvp-${slug}.csv`, [
        ["Nama", "Kehadiran", "Jumlah orang", "Waktu"],
        ...r.rsvps.map((x) => [x.name, STATUS[x.status], x.pax, when(x.createdAt)]),
      ]);
  };
  return (
    <div className="bg-card space-y-4 rounded-2xl border p-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void exportCsv("ucapan")}
          className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
        >
          Unduh ucapan (CSV)
        </button>
        <button
          type="button"
          onClick={() => void exportCsv("rsvp")}
          className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
        >
          Unduh RSVP (CSV)
        </button>
      </div>
      <GuestbookPanel invitationId={invitationId} />
    </div>
  );
}
