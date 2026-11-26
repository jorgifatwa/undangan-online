"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveShareTemplateAction } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/share-actions";
import {
  defaultTemplate,
  MAX_TEMPLATE,
  PLACEHOLDERS,
  renderShareMessage,
  waLink,
  type ShareInfo,
} from "@/lib/invitations/share";
import { guestLink } from "@/lib/site";
import { cn } from "@/lib/utils";

import {
  addGuestAction,
  addGuestsBulkAction,
  deleteGuestsAction,
  listGuestsAction,
  markSentAction,
} from "../../../guest-actions";

type Guest = {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  phone: string | null;
  sentAt: string | null;
  createdAt: string;
};
type Filter = "semua" | "belum" | "terkirim";

const inputCls =
  "h-9 rounded-lg border bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function csvCell(v: string) {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function download(name: string, rows: string[][]) {
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Daftar tamu & kirim undangan: tambah satu / tempel massal ("Nama, 08…"),
 * link personal (?to=Nama), kirim via WhatsApp (pribadi atau ke grup), salin
 * pesan, tandai terkirim / reset, cari & saring, unduh CSV, template pesan.
 */
export function GuestManager({
  invitationId,
  slug,
  info,
  initialTemplate,
  active,
}: {
  invitationId: string;
  slug: string;
  info: ShareInfo;
  initialTemplate: string | null;
  active: boolean;
}) {
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"satu" | "massal">("satu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");
  const [bulk, setBulk] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [groupFilter, setGroupFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fallback = useMemo(() => defaultTemplate(info), [info]);
  const [template, setTemplate] = useState(initialTemplate ?? fallback);
  const [showTemplate, setShowTemplate] = useState(false);
  const savedTemplate = useRef(initialTemplate ?? fallback);

  const reload = useCallback(async () => {
    const r = await listGuestsAction(invitationId);
    if (r.ok) setGuests(r.guests);
    else toast.error(r.error);
  }, [invitationId]);
  useEffect(() => {
    void reload();
  }, [reload]);

  // template tersimpan otomatis (null = bawaan)
  useEffect(() => {
    if (template === savedTemplate.current) return;
    const t = window.setTimeout(async () => {
      const value = template.trim() === fallback.trim() ? null : template;
      const r = await saveShareTemplateAction(invitationId, value);
      if (r.ok) savedTemplate.current = template;
      else toast.error(r.error);
    }, 800);
    return () => window.clearTimeout(t);
  }, [template, fallback, invitationId]);

  const message = (g: Pick<Guest, "name"> | null) =>
    renderShareMessage(template, {
      guestName: g?.name ?? null,
      link: guestLink(slug, g?.name),
      info,
    });

  const groups = useMemo(
    () => [...new Set((guests ?? []).map((g) => g.group).filter(Boolean) as string[])].sort(),
    [guests],
  );
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (guests ?? []).filter(
      (g) =>
        (!s || g.name.toLowerCase().includes(s) || g.phone?.includes(s)) &&
        (filter === "semua" || (filter === "terkirim" ? !!g.sentAt : !g.sentAt)) &&
        (!groupFilter || g.group === groupFilter),
    );
  }, [guests, q, filter, groupFilter]);
  const sentCount = (guests ?? []).filter((g) => g.sentAt).length;

  const markSent = (ids: string[], sent: boolean) =>
    start(async () => {
      const r = await markSentAction(invitationId, ids, sent);
      if (!r.ok) return void toast.error(r.error);
      setGuests((list) =>
        (list ?? []).map((g) =>
          ids.includes(g.id) ? { ...g, sentAt: sent ? new Date().toISOString() : null } : g,
        ),
      );
    });

  const copy = async (text: string, label = "Disalin") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      window.prompt("Salin:", text);
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="space-y-6">
      {!active && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Undangan belum tayang — link baru bisa dibuka tamu setelah dikonfirmasi.
        </p>
      )}

      {/* Tambah tamu */}
      <section className="bg-card rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Tambah tamu</h2>
          <div className="flex gap-1 text-xs" role="tablist">
            {(["satu", "massal"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full border px-2.5 py-1",
                  mode === m ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
                )}
              >
                {m === "satu" ? "Satu per satu" : "Tempel banyak"}
              </button>
            ))}
          </div>
        </div>
        {mode === "satu" ? (
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_9rem_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await addGuestAction(invitationId, { name, phone, group });
                if (!r.ok) return void toast.error(r.error);
                if (r.errors.length) return void toast.error(r.errors[0]);
                setName("");
                setPhone("");
                await reload();
              });
            }}
          >
            <input
              className={inputCls}
              placeholder="Nama tamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
            <input
              className={inputCls}
              placeholder="No. WA (opsional)"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Grup (opsional)"
              list="guest-groups"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              maxLength={40}
            />
            <button
              type="submit"
              disabled={pending}
              className="bg-primary text-primary-foreground h-9 rounded-lg px-4 text-sm font-medium disabled:opacity-60"
            >
              Tambah
            </button>
          </form>
        ) : (
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await addGuestsBulkAction(invitationId, bulk, group);
                if (!r.ok) return void toast.error(r.error);
                toast.success(`${r.added} tamu ditambahkan`, {
                  description: r.errors.slice(0, 3).join("\n") || undefined,
                });
                if (!r.errors.length) setBulk("");
                await reload();
              });
            }}
          >
            <textarea
              className="w-full rounded-lg border bg-white p-2.5 font-mono text-sm"
              rows={6}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={
                "Satu tamu per baris, contoh:\nBudi Santoso, 0812 3456 7890\nKeluarga Pak RT\nSiti, 0857…, Teman kantor"
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={inputCls}
                placeholder="Grup untuk semua (opsional)"
                list="guest-groups"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                maxLength={40}
              />
              <button
                type="submit"
                disabled={pending || !bulk.trim()}
                className="bg-primary text-primary-foreground h-9 rounded-lg px-4 text-sm font-medium disabled:opacity-60"
              >
                Tambahkan semua
              </button>
            </div>
          </form>
        )}
        <datalist id="guest-groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </section>

      {/* Template pesan + kirim ke grup */}
      <section className="bg-card rounded-2xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Pesan undangan</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowTemplate((v) => !v)}
              className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
            >
              {showTemplate ? "Tutup template" : "Ubah template"}
            </button>
            <a
              href={waLink(message(null))}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-[#1f9d55] px-3 py-1.5 text-sm font-medium text-white"
            >
              Kirim ke grup WA
            </a>
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Kirim ke grup memakai sapaan umum tanpa nama. Untuk link personal, kirim per tamu di
          daftar bawah.
        </p>
        {showTemplate && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  onClick={() => setTemplate((t) => `${t}${p.key}`)}
                  className="rounded-full border bg-white px-2 py-0.5 font-mono text-[11px]"
                >
                  {p.key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTemplate(fallback)}
                className="text-muted-foreground px-2 text-[11px] underline"
              >
                Kembalikan bawaan
              </button>
            </div>
            <textarea
              className="w-full rounded-lg border bg-white p-2.5 text-sm"
              rows={8}
              maxLength={MAX_TEMPLATE}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">Pratinjau (tamu contoh “Budi”):</p>
            <pre className="rounded-lg bg-neutral-50 p-2.5 text-xs whitespace-pre-wrap">
              {message({ name: "Budi" })}
            </pre>
          </div>
        )}
      </section>

      {/* Daftar tamu */}
      <section className="bg-card rounded-2xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">
            Daftar tamu{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({guests?.length ?? 0} · {sentCount} terkirim)
            </span>
          </h2>
          <button
            type="button"
            disabled={!guests?.length}
            onClick={() =>
              download(`tamu-${slug}.csv`, [
                ["Nama", "WhatsApp", "Grup", "Link", "Terkirim"],
                ...(guests ?? []).map((g) => [
                  g.name,
                  g.phone ?? "",
                  g.group ?? "",
                  guestLink(slug, g.name),
                  g.sentAt ? new Date(g.sentAt).toLocaleString("id-ID") : "",
                ]),
              ])
            }
            className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Unduh CSV
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={cn(inputCls, "min-w-0 flex-1")}
            placeholder="Cari nama / nomor"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={inputCls}
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="semua">Semua</option>
            <option value="belum">Belum dikirim</option>
            <option value="terkirim">Sudah dikirim</option>
          </select>
          {groups.length > 0 && (
            <select
              className={inputCls}
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">Semua grup</option>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          )}
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm">
            {selected.size} dipilih:
            <button
              type="button"
              className="underline"
              onClick={() => markSent([...selected], true)}
            >
              Tandai terkirim
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => markSent([...selected], false)}
            >
              Reset status
            </button>
            <button
              type="button"
              className="text-destructive underline"
              onClick={() =>
                confirm(`Hapus ${selected.size} tamu?`) &&
                start(async () => {
                  const r = await deleteGuestsAction(invitationId, [...selected]);
                  if (!r.ok) return void toast.error(r.error);
                  setSelected(new Set());
                  await reload();
                })
              }
            >
              Hapus
            </button>
            <button
              type="button"
              className="ml-auto text-xs underline"
              onClick={() => setSelected(new Set())}
            >
              Batal
            </button>
          </div>
        )}

        {guests === null ? (
          <p className="text-muted-foreground mt-4 text-sm">Memuat…</p>
        ) : shown.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            {guests.length === 0 ? "Belum ada tamu. Tambahkan di atas." : "Tidak ada yang cocok."}
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            <li className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
              <input
                type="checkbox"
                aria-label="Pilih semua yang tampil"
                checked={shown.every((g) => selected.has(g.id))}
                onChange={(e) =>
                  setSelected(e.target.checked ? new Set(shown.map((g) => g.id)) : new Set())
                }
              />
              Pilih semua ({shown.length})
            </li>
            {shown.map((g) => {
              const msg = message(g);
              return (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center gap-2 py-2.5"
                  data-testid="guest-row"
                >
                  <input
                    type="checkbox"
                    aria-label={`Pilih ${g.name}`}
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {g.name}
                      {g.group && (
                        <span className="text-muted-foreground ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-normal">
                          {g.group}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {g.phone ? `+${g.phone}` : "tanpa nomor"} ·{" "}
                      {g.sentAt ? (
                        <span className="text-emerald-700">
                          terkirim {new Date(g.sentAt).toLocaleDateString("id-ID")}
                        </span>
                      ) : (
                        "belum dikirim"
                      )}
                    </p>
                  </div>
                  <a
                    href={waLink(msg, g.phone)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => !g.sentAt && markSent([g.id], true)}
                    className="rounded-md bg-[#1f9d55] px-2.5 py-1 text-xs font-medium text-white"
                  >
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => void copy(msg, "Pesan disalin")}
                    className="hover:bg-muted rounded-md border px-2.5 py-1 text-xs"
                  >
                    Salin pesan
                  </button>
                  <button
                    type="button"
                    onClick={() => void copy(guestLink(slug, g.name), "Link disalin")}
                    className="hover:bg-muted rounded-md border px-2.5 py-1 text-xs"
                  >
                    Link
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
