import { ArrowRight, CircleCheck, Clock, CreditCard, Link2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/admin/PageHeader";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { SuspendedNotice } from "@/components/dashboard/SuspendedNotice";
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
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { DRAFT_MEDIA_RETENTION_DAYS, retentionStatus } from "@/lib/invitations/retention";
import { displayStatus, summarize } from "@/lib/invitations/summary";
import { invitationUrl } from "@/lib/site";
import { getManifest } from "@/themes/registry";

import { ClaimStatusBadge, claimStatusKey } from "./link-khusus/status";

export const metadata: Metadata = { title: "Dashboard" };

const INV_STATUS = {
  DRAFT: { label: "Draf", variant: "secondary" },
  PUBLISHED: { label: "Terbit", variant: "default" },
  SUSPENDED: { label: "Ditangguhkan", variant: "destructive" },
} as const;

/** Ringkasan admin: statistik pesanan, link khusus terbaru, undangan milik admin. */
export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400_000);
  const [openClaims, liveClaims, paidOrders, pendingOrders, recent, invitations] =
    await Promise.all([
      db.claimLink.count({ where: { status: "OPEN", expiresAt: { gt: now } } }),
      db.claimLink.count({ where: { status: "CONFIRMED" } }),
      db.webOrder.aggregate({
        where: { status: "PAID", paidAt: { gte: monthAgo } },
        _count: true,
        _sum: { amount: true },
      }),
      db.webOrder.count({ where: { status: "PENDING" } }),
      db.claimLink.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { invitation: { select: { themeId: true, activeUntil: true } } },
      }),
      db.invitation.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          eventType: true,
          themeId: true,
          data: true,
          status: true,
          purchasedAt: true,
          suspendedAt: true,
          suspendReason: true,
          lastEditedAt: true,
          mediaPurgedAt: true,
          updatedAt: true,
          _count: { select: { media: true } },
        },
      }),
    ]);

  const stats = [
    {
      label: "Menunggu diisi",
      value: openClaims,
      hint: "Link khusus aktif",
      icon: Clock,
    },
    { label: "Undangan tayang", value: liveClaims, hint: "Dari link khusus", icon: CircleCheck },
    {
      label: "Pesanan website",
      value: paidOrders._count,
      hint: `${formatRupiah(paidOrders._sum.amount ?? 0)} · 30 hari`,
      icon: CreditCard,
    },
    { label: "Menunggu bayar", value: pendingOrders, hint: "Pesanan website", icon: Link2 },
  ];

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name?.split(" ")[0] ?? "Admin"}`}
        description="Ringkasan pesanan & undangan. Buat link khusus untuk pembeli marketplace dari menu Link khusus."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/undangan/baru">
                <Plus /> Undangan manual
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/link-khusus">
                <Link2 /> Buat link khusus
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-2">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardAction>
                <s.icon className="text-gold size-4" />
              </CardAction>
              <CardTitle className="font-heading text-3xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">{s.hint}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Link khusus terbaru</CardTitle>
          <CardDescription>5 link terakhir yang dibuat (marketplace & website).</CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/link-khusus">
                Lihat semua <ArrowRight />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada link khusus.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.customerName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {getManifest(c.invitation.themeId)?.name ?? c.invitation.themeId} ·{" "}
                      {c.source === "WEBSITE" ? "Website" : (c.marketplace ?? "Marketplace")} ·{" "}
                      {formatTanggal(c.createdAt)}
                    </p>
                  </div>
                  <ClaimStatusBadge status={claimStatusKey(c, now)} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl">Undangan milik admin</h2>
          <p className="text-muted-foreground text-sm">
            Undangan yang dibuat manual dari panel ini.
          </p>
        </div>
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              Belum ada undangan manual.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {invitations.map((inv) => {
              const s = summarize(inv.eventType, inv.data);
              const manifest = getManifest(inv.themeId);
              const status = INV_STATUS[displayStatus(inv.status, inv.suspendedAt)];
              const r = retentionStatus(inv, inv._count.media > 0);
              return (
                <Card key={inv.id} className="flex-row gap-4 p-3">
                  <div
                    className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-lg"
                    style={{ background: manifest?.thumbnail.background ?? "#ddd" }}
                  >
                    {s.cover ? (
                      <Image src={s.cover} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span
                        className="font-heading absolute inset-0 grid place-items-center text-xl"
                        style={{ color: manifest?.thumbnail.foreground ?? "#fff" }}
                      >
                        {s.initials}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{s.title}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {s.dateLabel ?? "Tanggal belum valid"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Tema {manifest?.name ?? inv.themeId} ·{" "}
                      {inv.purchasedAt ? "Tema sudah dibeli" : "Draf · belum dibeli"}
                    </p>
                    {inv.suspendedAt && (
                      <SuspendedNotice reason={inv.suspendReason} slug={inv.slug} compact />
                    )}
                    {r && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        {r.kind === "warning"
                          ? `Foto & musik dihapus ${formatTanggal(r.deleteAt)} (${r.daysLeft} hari lagi) — draf belum dibeli & tidak diubah ${DRAFT_MEDIA_RETENTION_DAYS} hari.`
                          : `Foto & musik dihapus otomatis pada ${formatTanggal(r.at)}.`}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-3">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/undangan/${inv.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/undangan/${inv.id}/pratinjau`} target="_blank">
                          Pratinjau
                        </Link>
                      </Button>
                      <CopyLinkButton
                        url={invitationUrl(inv.slug)}
                        draft={inv.status === "DRAFT"}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
