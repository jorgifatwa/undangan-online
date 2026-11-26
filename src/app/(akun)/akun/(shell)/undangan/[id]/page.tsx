import {
  CalendarClock,
  CalendarHeart,
  ExternalLink,
  Link2,
  MessagesSquare,
  PenLine,
  Send,
  UserCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { formatTanggal } from "@/lib/format";
import { guestbookStats } from "@/lib/guestbook/service";
import { isActive } from "@/lib/invitations/publish";
import { shareInfo } from "@/lib/invitations/share";
import { summarize } from "@/lib/invitations/summary";
import { invitationUrl } from "@/lib/site";
import { parseInvitationData } from "@/schemas";
import { getManifest, themeThumb } from "@/themes/registry";

import { GuestManager } from "./GuestManager";
import { GuestbookTab } from "./GuestbookTab";

export const metadata: Metadata = { title: "Kelola undangan", robots: { index: false } };

/** Kelola satu undangan pembeli: ringkasan, ubah data, tamu & kirim, ucapan & RSVP. */
export default async function AkunInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "ucapan" ? "ucapan" : "tamu";
  const user = await requireCustomer();
  const inv = await db.invitation.findFirst({
    where: { id: String(id).slice(0, 40), userId: user.id },
    include: { claim: true },
  });
  if (!inv) notFound();
  const parsed = parseInvitationData(inv.eventType, inv.data);
  if (!parsed.ok) notFound();

  const phase = claimPhase(inv.claim, inv);
  const live = isActive(inv);
  const s = summarize(inv.eventType, inv.data);
  const manifest = getManifest(inv.themeId);
  const thumb = themeThumb(inv.themeId);
  const [many, guestTotal, guestSent, stats] = await Promise.all([
    db.invitation.count({ where: { userId: user.id } }).then((n) => n > 1),
    db.guest.count({ where: { invitationId: inv.id } }),
    db.guest.count({ where: { invitationId: inv.id, NOT: { sentAt: null } } }),
    guestbookStats(inv.id),
  ]);

  const tiles = [
    { label: "Tamu", value: guestTotal, hint: "di daftar", icon: Users },
    { label: "Terkirim", value: guestSent, hint: "lewat WhatsApp", icon: Send },
    { label: "Hadir", value: stats.hadir, hint: `${stats.orang} orang`, icon: UserCheck },
    { label: "Ucapan", value: stats.ucapan, hint: "dari tamu", icon: MessagesSquare },
  ];

  return (
    <>
      {many && (
        <Link href="/akun" className="text-muted-foreground -mb-4 block text-sm hover:underline">
          ← Undangan saya
        </Link>
      )}

      {/* Kartu pembuka: sampul + status + aksi */}
      <Card className="bg-sand paper relative overflow-hidden rounded-[28px] border-none p-0 shadow-[0_30px_80px_-50px_rgb(80_40_20/0.45)]">
        <div
          aria-hidden
          className="border-gold/40 absolute -top-24 -right-24 hidden size-72 rounded-full border sm:block"
        />
        <CardContent className="relative grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          <div
            className="relative mx-auto aspect-[9/16] w-28 overflow-hidden rounded-[1.4rem] border-[5px] border-neutral-900 shadow-xl sm:mx-0 sm:w-32"
            style={{ background: manifest?.thumbnail.background ?? "#ddd" }}
          >
            {s.cover ? (
              <Image src={s.cover} alt="" fill sizes="128px" className="object-cover" />
            ) : thumb ? (
              <Image src={thumb} alt="" fill sizes="128px" unoptimized className="object-cover" />
            ) : (
              <span
                className="font-heading absolute inset-0 grid place-items-center text-2xl"
                style={{ color: manifest?.thumbnail.foreground ?? "#fff" }}
              >
                {s.initials}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-3 text-center sm:text-left">
            <p className="text-gold-ink text-[11px] font-semibold tracking-[0.24em] uppercase">
              {inv.eventType === "WEDDING" ? "Undangan pernikahan" : "Undangan ulang tahun"}
            </p>
            <h1 className="font-heading text-4xl leading-tight tracking-tight text-balance">
              {s.title}
            </h1>
            <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CalendarHeart className="size-4" /> {s.dateLabel ?? "Tanggal belum diisi"}
              </span>
              <span>Tema {manifest?.name ?? inv.themeId}</span>
            </p>

            {live ? (
              <div className="bg-background/70 flex flex-wrap items-center justify-center gap-2 rounded-2xl border p-2 pl-3 sm:justify-start">
                <Badge className="bg-emerald-100 text-emerald-900">Tayang</Badge>
                <a
                  href={invitationUrl(inv.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline"
                >
                  {invitationUrl(inv.slug).replace(/^https?:\/\//, "")}
                </a>
                <CopyLinkButton url={invitationUrl(inv.slug)} draft={false} />
              </div>
            ) : (
              <div className="bg-background/70 flex items-start gap-3 rounded-2xl border p-3 text-left text-sm">
                <Link2 className="text-primary mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">Belum tayang.</span> Selesaikan
                  pengisian lewat link khusus yang kami kirim
                  {inv.claim ? ` — berlaku sampai ${formatTanggal(inv.claim.expiresAt)}` : ""}. Link
                  tamu bisa dibuka setelah undangan dikonfirmasi.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {phase === "live" && (
                <Button asChild className="rounded-full">
                  <Link href={`/akun/undangan/${inv.id}/edit`}>
                    <PenLine /> Ubah data undangan
                  </Link>
                </Button>
              )}
              {live && (
                <Button asChild variant="outline" className="bg-background/70 rounded-full">
                  <a href={invitationUrl(inv.slug)} target="_blank" rel="noreferrer">
                    <ExternalLink /> Lihat undangan
                  </a>
                </Button>
              )}
              {phase === "live" && inv.activeUntil && (
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <CalendarClock className="size-3.5" /> Bisa diubah sampai{" "}
                  {formatTanggal(inv.activeUntil)}
                </span>
              )}
              {phase === "locked" && live && (
                <span className="text-muted-foreground text-xs">
                  Masa ubah data sudah berakhir. Hubungi admin bila perlu perubahan.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan angka */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="flex-row items-center gap-3 p-4">
            <span className="bg-sand text-primary grid size-10 shrink-0 place-items-center rounded-xl">
              <t.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-2xl leading-none tabular-nums">{t.value}</p>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {t.label} · {t.hint}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={tab} className="gap-6">
        <TabsList
          variant="line"
          aria-label="Menu undangan"
          className="w-full justify-start border-b"
        >
          <TabsTrigger value="tamu" asChild className="flex-none px-4">
            <Link href={`/akun/undangan/${inv.id}?tab=tamu`} scroll={false}>
              <Users /> Tamu &amp; kirim undangan
            </Link>
          </TabsTrigger>
          <TabsTrigger value="ucapan" asChild className="flex-none px-4">
            <Link href={`/akun/undangan/${inv.id}?tab=ucapan`} scroll={false}>
              <MessagesSquare /> Ucapan &amp; RSVP
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tamu">
          <GuestManager
            invitationId={inv.id}
            slug={inv.slug}
            info={shareInfo(parsed.value)}
            initialTemplate={inv.shareTemplate}
            active={live}
          />
        </TabsContent>
        <TabsContent value="ucapan">
          <GuestbookTab invitationId={inv.id} slug={inv.slug} />
        </TabsContent>
      </Tabs>
    </>
  );
}
