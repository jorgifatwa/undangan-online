"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { Eye, EyeOff, Search, Trash2 } from "lucide-react";

import { ClientPagination } from "@/components/data/ClientPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
const PAGE = 10;
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
  const [q, setQ] = useState("");
  const [wishFilter, setWishFilter] = useState<"semua" | "tampil" | "sembunyi">("semua");
  const [rsvpFilter, setRsvpFilter] = useState<"semua" | "HADIR" | "RAGU" | "TIDAK_HADIR">("semua");
  const [page, setPage] = useState(1);
  // halaman kembali ke 1 bila tab/pencarian/filter berubah
  useEffect(() => setPage(1), [tab, q, wishFilter, rsvpFilter]);
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
  const needle = q.trim().toLowerCase();
  const wishes = data.wishes.filter(
    (w) =>
      (!needle ||
        w.name.toLowerCase().includes(needle) ||
        w.message.toLowerCase().includes(needle)) &&
      (wishFilter === "semua" || (wishFilter === "sembunyi" ? w.isHidden : !w.isHidden)),
  );
  const rsvps = data.rsvps.filter(
    (r) =>
      (!needle || r.name.toLowerCase().includes(needle)) &&
      (rsvpFilter === "semua" || r.status === rsvpFilter),
  );
  const total = tab === "ucapan" ? wishes.length : rsvps.length;
  const curPage = Math.min(page, Math.max(1, Math.ceil(total / PAGE)));
  const wishPage = wishes.slice((curPage - 1) * PAGE, curPage * PAGE);
  const rsvpPage = rsvps.slice((curPage - 1) * PAGE, curPage * PAGE);

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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "ucapan" ? "Cari nama atau isi ucapan" : "Cari nama"}
            aria-label="Cari"
            className="pl-8"
          />
        </div>
        {tab === "ucapan" ? (
          <Select value={wishFilter} onValueChange={(v) => setWishFilter(v as typeof wishFilter)}>
            <SelectTrigger className="w-40" aria-label="Filter ucapan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua ucapan</SelectItem>
              <SelectItem value="tampil">Tampil</SelectItem>
              <SelectItem value="sembunyi">Disembunyikan</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={rsvpFilter} onValueChange={(v) => setRsvpFilter(v as typeof rsvpFilter)}>
            <SelectTrigger className="w-40" aria-label="Filter kehadiran">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              <SelectItem value="HADIR">Hadir</SelectItem>
              <SelectItem value="RAGU">Ragu</SelectItem>
              <SelectItem value="TIDAK_HADIR">Tidak hadir</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {tab === "ucapan" ? (
        wishes.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {data.wishes.length === 0 ? "Belum ada ucapan." : "Tidak ada ucapan yang cocok."}
          </p>
        ) : (
          <ul className="space-y-2">
            {wishPage.map((w) => (
              <li
                key={w.id}
                data-wish-id={w.id}
                className={cn("bg-card rounded-xl border p-3 text-sm", w.isHidden && "opacity-60")}
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
                      <Badge variant="secondary" className="ml-1.5 font-normal">
                        disembunyikan
                      </Badge>
                    )}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {fmt(w.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line">{w.message}</p>
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={pending}
                    onClick={() => act(() => hideWishAction(invitationId, w.id, !w.isHidden))}
                  >
                    {w.isHidden ? <Eye /> : <EyeOff />} {w.isHidden ? "Tampilkan" : "Sembunyikan"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      window.confirm(`Hapus ucapan dari ${w.name}?`) &&
                      act(() => deleteWishAction(invitationId, w.id))
                    }
                  >
                    <Trash2 /> Hapus
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : rsvps.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {data.rsvps.length === 0
            ? "Belum ada konfirmasi kehadiran."
            : "Tidak ada konfirmasi yang cocok."}
        </p>
      ) : (
        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orang</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsvpPage.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.name}
                    <span className="text-muted-foreground block text-[11px]">
                      {fmt(r.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>{STATUS[r.status]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.status === "HADIR" ? r.pax : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Hapus konfirmasi ${r.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        window.confirm(`Hapus konfirmasi ${r.name}?`) &&
                        act(() => deleteRsvpAction(invitationId, r.id))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ClientPagination
        page={curPage}
        total={tab === "ucapan" ? wishes.length : rsvps.length}
        pageSize={PAGE}
        onPage={setPage}
        unit={tab === "ucapan" ? "ucapan" : "konfirmasi"}
      />
    </div>
  );
}
