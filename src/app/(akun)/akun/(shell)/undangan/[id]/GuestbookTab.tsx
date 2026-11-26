"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl font-normal">Ucapan &amp; RSVP</CardTitle>
        <CardDescription>
          Rekap kehadiran dan ucapan tamu; sembunyikan yang tidak pantas.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => void exportCsv("ucapan")}>
            <Download /> Unduh ucapan (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportCsv("rsvp")}>
            <Download /> Unduh RSVP (CSV)
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <GuestbookPanel invitationId={invitationId} />
      </CardContent>
    </Card>
  );
}
