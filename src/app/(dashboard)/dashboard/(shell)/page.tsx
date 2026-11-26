import {
  AlertTriangle,
  CircleCheck,
  Link2,
  MessageCircle,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/PageHeader";
import { RevenueChart } from "@/components/admin/RevenueChart";
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
import { getAttention } from "@/lib/admin/attention";
import { getBusinessMetrics, resolvePeriod } from "@/lib/admin/metrics";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { waLink } from "@/lib/invitations/share";
import { summarize } from "@/lib/invitations/summary";
import { getManifest } from "@/themes/registry";

import { ClaimRowActions } from "./link-khusus/ClaimRowActions";
import { OrderActions } from "./pesanan/OrderActions";
import { PeriodPicker } from "./PeriodPicker";

export const metadata: Metadata = { title: "Ringkasan bisnis" };

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");

/** Ringkasan bisnis admin: pendapatan, pesanan, corong, tema, sumber, perlu tindakan. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const period = resolvePeriod(await searchParams);
  const [m, attention, myInvitations] = await Promise.all([
    getBusinessMetrics(period),
    getAttention(),
    db.invitation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, slug: true, eventType: true, data: true, status: true, themeId: true },
    }),
  ]);
  const emailEnabled = emailConfigured();

  const kpis = [
    {
      label: "Pendapatan",
      value: formatRupiah(m.revenue.total),
      hint: `Website ${formatRupiah(m.revenue.website)} · Marketplace ${formatRupiah(m.revenue.marketplace)}`,
      icon: TrendingUp,
    },
    {
      label: "Pesanan",
      value: String(m.orders.total),
      hint: `${m.orders.website} website · ${m.orders.marketplace} marketplace`,
      icon: ShoppingBag,
    },
    {
      label: "Rata-rata nilai pesanan",
      value: formatRupiah(m.aov),
      hint: "Pendapatan ÷ pesanan",
      icon: Receipt,
    },
    {
      label: "Undangan tayang",
      value: String(m.live),
      hint: "Dikonfirmasi pembeli",
      icon: CircleCheck,
    },
  ];
  const funnelTop = Math.max(1, ...m.funnel.map((f) => f.value));
  const sourceTop = Math.max(1, ...m.sources.map((s) => s.revenue));
  const themeTop = Math.max(1, ...m.topThemes.map((t) => t.revenue));

  return (
    <>
      <PageHeader
        title="Ringkasan bisnis"
        description={`Periode ${formatTanggal(period.from)} – ${formatTanggal(new Date(period.to.getTime() - 1))} (WIB).`}
        actions={
          <Button asChild>
            <Link href="/dashboard/link-khusus">
              <Link2 /> Buat link khusus
            </Link>
          </Button>
        }
      />
      <PeriodPicker period={period} base="/dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-2">
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
              <CardAction>
                <k.icon className="text-gold size-4" />
              </CardAction>
              <CardTitle className="font-heading text-3xl font-normal tabular-nums">
                {k.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">
            Pendapatan per {m.bucket}
          </CardTitle>
          <CardDescription>
            Website = pembayaran Midtrans lunas · Marketplace = nominal diterima saat link khusus
            dibuat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={m.series} bucket={m.bucket} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Corong konversi</CardTitle>
            <CardDescription>Dari pengunjung sampai akun pembeli.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {m.funnel.map((f, i) => (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>
                      {f.label}
                      {f.note && <span className="text-muted-foreground text-xs"> · {f.note}</span>}
                    </span>
                    <span className="font-medium tabular-nums">
                      {f.value}
                      {i > 0 && (
                        <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                          {pct(f.value, m.funnel[i - 1].value)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(f.value / funnelTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Tema terlaris</CardTitle>
            <CardDescription>Menurut pendapatan dalam periode.</CardDescription>
          </CardHeader>
          <CardContent>
            {m.topThemes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada penjualan.</p>
            ) : (
              <ul className="space-y-3">
                {m.topThemes.map((t) => (
                  <li key={t.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>
                        {t.name}{" "}
                        <span className="text-muted-foreground text-xs">· {t.count} pesanan</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatRupiah(t.revenue)}</span>
                    </div>
                    <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(t.revenue / themeTop) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Sumber pesanan</CardTitle>
            <CardDescription>Website dan tiap marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            {m.sources.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pesanan.</p>
            ) : (
              <ul className="space-y-3">
                {m.sources.map((s) => (
                  <li key={s.label}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>
                        {s.label}{" "}
                        <span className="text-muted-foreground text-xs">· {s.count} pesanan</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatRupiah(s.revenue)}</span>
                    </div>
                    <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${s.label === "Website" ? "bg-primary" : "bg-gold"}`}
                        style={{ width: `${(s.revenue / sourceTop) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Perlu tindakan */}
      <Card id="perlu-tindakan">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-xl font-normal">
            Perlu tindakan
            {attention.total > 0 && (
              <Badge className="bg-amber-100 text-amber-900">{attention.total}</Badge>
            )}
          </CardTitle>
          <CardDescription>Hal yang sebaiknya ditindaklanjuti hari ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attention.total === 0 && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CircleCheck className="size-4 text-emerald-600" /> Semua beres — tidak ada yang perlu
              ditindaklanjuti.
            </p>
          )}

          {attention.expiring.length > 0 && (
            <AttentionGroup title="Link khusus hampir kedaluwarsa, belum dikonfirmasi">
              {attention.expiring.map((c) => (
                <Row
                  key={c.id}
                  title={c.customerName}
                  meta={`${getManifest(c.invitation.themeId)?.name ?? c.invitation.themeId} · berakhir ${formatTanggal(c.expiresAt)}`}
                >
                  {c.customerPhone && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={waLink(
                          `Halo Kak ${c.customerName}, link pengisian undangan Kakak berlaku sampai ${formatTanggal(c.expiresAt)}. Yuk dilengkapi & dikonfirmasi agar undangan bisa tayang 🙏`,
                          c.customerPhone,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle /> Ingatkan
                      </a>
                    </Button>
                  )}
                  <ClaimRowActions
                    claimId={c.id}
                    customerName={c.customerName}
                    status={c.status}
                    expired={false}
                    defaultEmail={c.invitation.user.email ?? c.customerEmail ?? ""}
                    hasLogin={!!c.invitation.user.email}
                    emailEnabled={emailEnabled}
                  />
                </Row>
              ))}
            </AttentionGroup>
          )}

          {attention.liveNoAccount.length > 0 && (
            <AttentionGroup title="Undangan tayang, pembeli belum dibuatkan akun">
              {attention.liveNoAccount.map((c) => (
                <Row
                  key={c.id}
                  title={c.customerName}
                  meta={`/${c.invitation.slug} · tayang ${c.confirmedAt ? formatTanggal(c.confirmedAt) : ""}`}
                >
                  <ClaimRowActions
                    claimId={c.id}
                    customerName={c.customerName}
                    status={c.status}
                    expired={false}
                    defaultEmail={c.customerEmail ?? ""}
                    hasLogin={false}
                    emailEnabled={emailEnabled}
                  />
                </Row>
              ))}
            </AttentionGroup>
          )}

          {attention.activeEnding.length > 0 && (
            <AttentionGroup title="Masa aktif undangan hampir habis (≤ 14 hari)">
              {attention.activeEnding.map((c) => (
                <Row
                  key={c.id}
                  title={c.customerName}
                  meta={`/${c.invitation.slug} · aktif s.d. ${c.invitation.activeUntil ? formatTanggal(c.invitation.activeUntil) : "-"}`}
                >
                  <ClaimRowActions
                    claimId={c.id}
                    customerName={c.customerName}
                    status={c.status}
                    expired={false}
                    defaultEmail={c.invitation.user.email ?? c.customerEmail ?? ""}
                    hasLogin={!!c.invitation.user.email}
                    emailEnabled={emailEnabled}
                  />
                </Row>
              ))}
            </AttentionGroup>
          )}

          {(attention.emailFailed.length > 0 || attention.unfulfilled.length > 0) && (
            <AttentionGroup title="Pesanan lunas: email belum terkirim / link belum dibuat">
              {[...attention.unfulfilled, ...attention.emailFailed].map((o) => (
                <Row
                  key={o.id}
                  title={`${o.buyerName} · ${formatRupiah(o.amount)}`}
                  meta={`${o.midtransOrderId} · ${o.buyerEmail} · ${o.claimId ? "email belum terkirim" : "link belum dibuat"}`}
                >
                  <OrderActions
                    id={o.id}
                    status={o.status}
                    hasClaim={!!o.claimId}
                    emailEnabled={emailEnabled}
                  />
                </Row>
              ))}
            </AttentionGroup>
          )}

          {attention.stuckPayment.length > 0 && (
            <AttentionGroup title="Pembayaran tertahan (> 1 jam belum lunas)">
              {attention.stuckPayment.map((o) => (
                <Row
                  key={o.id}
                  title={`${o.buyerName} · ${formatRupiah(o.amount)}`}
                  meta={`${o.midtransOrderId} · dibuat ${formatTanggal(o.createdAt)}`}
                >
                  <OrderActions
                    id={o.id}
                    status={o.status}
                    hasClaim={false}
                    emailEnabled={emailEnabled}
                  />
                </Row>
              ))}
            </AttentionGroup>
          )}
          {!emailEnabled && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <AlertTriangle className="size-3.5 text-amber-600" /> SMTP belum diisi — email ke
              pembeli & laporan harian belum bisa dikirim.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">Undangan milik admin</CardTitle>
          <CardDescription>Dibuat manual dari panel ini.</CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/undangan/baru">
                <Plus /> Undangan manual
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {myInvitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada undangan manual.</p>
          ) : (
            <ul className="divide-y">
              {myInvitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    {summarize(inv.eventType, inv.data).title}{" "}
                    <span className="text-muted-foreground text-xs">
                      · {getManifest(inv.themeId)?.name ?? inv.themeId} ·{" "}
                      {inv.status === "PUBLISHED" ? "Terbit" : "Draf"}
                    </span>
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/undangan/${inv.id}/edit`}>Edit</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AttentionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-2 divide-y rounded-xl border">{children}</ul>
    </section>
  );
}

function Row({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{meta}</p>
      </div>
      <div className="flex items-center gap-1.5">{children}</div>
    </li>
  );
}
