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
import {
  Copy,
  Download,
  Link2,
  MessageCircle,
  PenLine,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Tambah tamu */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Tambah tamu</CardTitle>
            <CardDescription>Satu per satu, atau tempel daftar dari catatan/Excel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "satu" | "massal")}>
              <TabsList>
                <TabsTrigger value="satu">Satu per satu</TabsTrigger>
                <TabsTrigger value="massal">Tempel banyak</TabsTrigger>
              </TabsList>
              <TabsContent value="satu" className="pt-3">
                <form
                  className="grid grid-cols-2 gap-2"
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
                  <Input
                    className="col-span-2"
                    placeholder="Nama tamu"
                    aria-label="Nama tamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                  <Input
                    placeholder="No. WA (opsional)"
                    aria-label="Nomor WhatsApp"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Grup (opsional)"
                    aria-label="Grup"
                    list="guest-groups"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    maxLength={40}
                  />
                  <Button type="submit" className="col-span-2" disabled={pending}>
                    <UserPlus /> Tambah tamu
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="massal" className="space-y-2 pt-3">
                <form
                  className="space-y-2"
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
                  <Textarea
                    className="font-mono"
                    rows={6}
                    value={bulk}
                    onChange={(e) => setBulk(e.target.value)}
                    placeholder={
                      "Satu tamu per baris, contoh:\nBudi Santoso, 0812 3456 7890\nKeluarga Pak RT\nSiti, 0857…, Teman kantor"
                    }
                  />
                  <div className="grid gap-2">
                    <Input
                      placeholder="Grup untuk semua (opsional)"
                      list="guest-groups"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      maxLength={40}
                    />
                    <Button type="submit" disabled={pending || !bulk.trim()}>
                      Tambahkan semua
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            <datalist id="guest-groups">
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </CardContent>
        </Card>

        {/* Template pesan + kirim ke grup */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Pesan undangan</CardTitle>
            <CardDescription>
              Kirim ke grup memakai sapaan umum tanpa nama. Untuk link personal, kirim per tamu dari
              daftar tamu.
              {!active && " Link baru bisa dibuka tamu setelah undangan tayang."}
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowTemplate((v) => !v)}>
                <PenLine /> {showTemplate ? "Tutup template" : "Ubah template"}
              </Button>
              <Button asChild size="sm" className="bg-[#1f9d55] text-white hover:bg-[#1f9d55]/90">
                <a href={waLink(message(null))} target="_blank" rel="noreferrer">
                  <MessageCircle /> Kirim ke grup WA
                </a>
              </Button>
            </div>
          </CardHeader>
          {showTemplate && (
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <Badge
                    key={p.key}
                    asChild
                    variant="outline"
                    className="cursor-pointer font-mono"
                    title={p.label}
                  >
                    <button type="button" onClick={() => setTemplate((t) => `${t}${p.key}`)}>
                      {p.key}
                    </button>
                  </Badge>
                ))}
                <Button variant="link" size="xs" onClick={() => setTemplate(fallback)}>
                  Kembalikan bawaan
                </Button>
              </div>
              <Textarea
                rows={8}
                maxLength={MAX_TEMPLATE}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Pratinjau (tamu contoh “Budi”):</p>
              <pre className="bg-muted/60 rounded-lg p-3 text-xs whitespace-pre-wrap">
                {message({ name: "Budi" })}
              </pre>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Daftar tamu */}
      <Card className="min-h-80">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">Daftar tamu</CardTitle>
          <CardDescription>
            {guests?.length ?? 0} tamu · {sentCount} terkirim
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
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
            >
              <Download /> Unduh CSV
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                className="pl-8"
                placeholder="Cari nama / nomor"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-40" aria-label="Status kirim">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="belum">Belum dikirim</SelectItem>
                <SelectItem value="terkirim">Sudah dikirim</SelectItem>
              </SelectContent>
            </Select>
            {groups.length > 0 && (
              <Select
                value={groupFilter || "__all"}
                onValueChange={(v) => setGroupFilter(v === "__all" ? "" : v)}
              >
                <SelectTrigger className="w-40" aria-label="Grup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Semua grup</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selected.size > 0 && (
            <div className="bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm">
              {selected.size} dipilih:
              <Button variant="ghost" size="sm" onClick={() => markSent([...selected], true)}>
                Tandai terkirim
              </Button>
              <Button variant="ghost" size="sm" onClick={() => markSent([...selected], false)}>
                Reset status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
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
                <Trash2 /> Hapus
              </Button>
              <Button
                variant="link"
                size="xs"
                className="ml-auto"
                onClick={() => setSelected(new Set())}
              >
                Batal
              </Button>
            </div>
          )}

          {guests === null ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="bg-sand text-primary grid size-14 place-items-center rounded-full">
                <Users className="size-6" />
              </span>
              <p className="font-heading text-xl">
                {guests.length === 0 ? "Belum ada tamu" : "Tidak ada yang cocok"}
              </p>
              <p className="text-muted-foreground max-w-xs text-sm">
                {guests.length === 0
                  ? "Tambahkan tamu satu per satu atau tempel daftar sekaligus, lalu kirim undangan personal lewat WhatsApp."
                  : "Coba kata kunci atau saringan lain."}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              <li className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
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
                    className="flex flex-wrap items-center gap-2 py-3"
                    data-testid="guest-row"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      aria-label={`Pilih ${g.name}`}
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {g.name}
                        {g.group && <Badge variant="secondary">{g.group}</Badge>}
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
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#1f9d55] text-white hover:bg-[#1f9d55]/90"
                    >
                      <a
                        href={waLink(msg, g.phone)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => !g.sentAt && markSent([g.id], true)}
                      >
                        <MessageCircle /> WhatsApp
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copy(msg, "Pesan disalin")}
                    >
                      <Copy /> Pesan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copy(guestLink(slug, g.name), "Link disalin")}
                    >
                      <Link2 /> Link
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
