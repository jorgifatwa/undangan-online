import "server-only";

import { visitTotals } from "@/lib/analytics/visits";
import { db } from "@/lib/db";
import { getManifest } from "@/themes/registry";

/**
 * METRIK BISNIS untuk panel admin. Semua tanggal dihitung menurut WIB.
 *  - Pendapatan website   = WebOrder LUNAS (paidAt dalam rentang), nominal Midtrans.
 *  - Pendapatan marketplace = link khusus MARKETPLACE yang dibuat dalam rentang
 *    (link dibuat setelah pembayaran dikonfirmasi), nominal diterima / harga tema;
 *    link yang dicabut tidak dihitung.
 */
const WIB = 7 * 3600_000;
const DAY = 86400_000;

/** "yyyy-mm-dd" menurut WIB. */
export const wibDate = (d: Date) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
/** Awal hari WIB dari "yyyy-mm-dd". */
export const wibStart = (ymd: string) => new Date(new Date(`${ymd}T00:00:00Z`).getTime() - WIB);

export interface Period {
  from: Date;
  /** Eksklusif (awal hari setelah hari terakhir). */
  to: Date;
  fromYmd: string;
  toYmd: string;
  days: number;
  preset: "7" | "30" | "90" | "custom";
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Rentang dari searchParams (?p=7|30|90 atau ?from=&to=), bawaan 30 hari. */
export function resolvePeriod(
  sp: { p?: string; from?: string; to?: string },
  now = new Date(),
): Period {
  const todayYmd = wibDate(now);
  if (sp.from && sp.to && YMD.test(sp.from) && YMD.test(sp.to) && sp.from <= sp.to) {
    const from = wibStart(sp.from);
    const to = new Date(wibStart(sp.to).getTime() + DAY);
    const days = Math.min(366, Math.round((to.getTime() - from.getTime()) / DAY));
    return {
      from,
      to: new Date(from.getTime() + days * DAY),
      fromYmd: sp.from,
      toYmd: sp.to,
      days,
      preset: "custom",
    };
  }
  const n = sp.p === "7" ? 7 : sp.p === "90" ? 90 : 30;
  const to = new Date(wibStart(todayYmd).getTime() + DAY);
  const from = new Date(to.getTime() - n * DAY);
  return {
    from,
    to,
    fromYmd: wibDate(from),
    toYmd: todayYmd,
    days: n,
    preset: String(n) as Period["preset"],
  };
}

export interface SeriesPoint {
  key: string;
  label: string;
  website: number;
  marketplace: number;
}

export interface BusinessMetrics {
  revenue: { website: number; marketplace: number; total: number };
  orders: { website: number; marketplace: number; total: number };
  aov: number;
  live: number;
  series: SeriesPoint[];
  bucket: "hari" | "minggu";
  topThemes: { id: string; name: string; count: number; revenue: number }[];
  sources: { label: string; count: number; revenue: number }[];
  funnel: { label: string; value: number; note?: string }[];
}

const SHORT = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

export async function getBusinessMetrics(period: Period): Promise<BusinessMetrics> {
  const { from, to } = period;
  const [paid, created, claims, confirmed, logins, visits] = await Promise.all([
    db.webOrder.findMany({
      where: { status: "PAID", paidAt: { gte: from, lt: to } },
      select: { amount: true, paidAt: true, themeId: true },
    }),
    db.webOrder.count({ where: { createdAt: { gte: from, lt: to } } }),
    db.claimLink.findMany({
      where: {
        source: "MARKETPLACE",
        status: { not: "REVOKED" },
        createdAt: { gte: from, lt: to },
      },
      select: {
        price: true,
        receivedAmount: true,
        marketplace: true,
        createdAt: true,
        invitation: { select: { themeId: true } },
      },
    }),
    db.claimLink.count({ where: { confirmedAt: { gte: from, lt: to } } }),
    db.adminAudit.findMany({
      where: { action: "claim.login", createdAt: { gte: from, lt: to } },
      select: { invitationId: true },
      distinct: ["invitationId"],
    }),
    visitTotals(from, new Date(to.getTime() - 1)),
  ]);

  const mpAmount = (c: (typeof claims)[number]) => c.receivedAmount ?? c.price;
  const revenue = {
    website: paid.reduce((s, o) => s + o.amount, 0),
    marketplace: claims.reduce((s, c) => s + mpAmount(c), 0),
    total: 0,
  };
  revenue.total = revenue.website + revenue.marketplace;
  const orders = {
    website: paid.length,
    marketplace: claims.length,
    total: paid.length + claims.length,
  };

  // Deret waktu: per hari (≤ 45 hari) atau per minggu.
  const bucket = period.days > 45 ? "minggu" : "hari";
  const size = bucket === "hari" ? 1 : 7;
  const n = Math.ceil(period.days / size);
  const series: SeriesPoint[] = Array.from({ length: n }, (_, i) => {
    const start = new Date(from.getTime() + i * size * DAY);
    const startLabel = SHORT.format(new Date(start.getTime() + WIB));
    return {
      key: wibDate(start),
      label:
        bucket === "hari"
          ? startLabel
          : `${startLabel}–${SHORT.format(new Date(Math.min(start.getTime() + (size - 1) * DAY, to.getTime() - DAY) + WIB))}`,
      website: 0,
      marketplace: 0,
    };
  });
  const idx = (d: Date) =>
    Math.min(n - 1, Math.floor((d.getTime() - from.getTime()) / (size * DAY)));
  for (const o of paid) if (o.paidAt) series[idx(o.paidAt)].website += o.amount;
  for (const c of claims) series[idx(c.createdAt)].marketplace += mpAmount(c);

  // Tema terlaris (website + marketplace).
  const themes = new Map<string, { count: number; revenue: number }>();
  const addTheme = (id: string, amount: number) => {
    const t = themes.get(id) ?? { count: 0, revenue: 0 };
    t.count++;
    t.revenue += amount;
    themes.set(id, t);
  };
  for (const o of paid) addTheme(o.themeId, o.amount);
  for (const c of claims) addTheme(c.invitation.themeId, mpAmount(c));
  const topThemes = [...themes.entries()]
    .map(([id, t]) => ({ id, name: getManifest(id)?.name ?? id, ...t }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Sumber pesanan.
  const src = new Map<string, { count: number; revenue: number }>();
  if (paid.length) src.set("Website", { count: paid.length, revenue: revenue.website });
  for (const c of claims) {
    const k = c.marketplace || "Marketplace";
    const s = src.get(k) ?? { count: 0, revenue: 0 };
    s.count++;
    s.revenue += mpAmount(c);
    src.set(k, s);
  }
  const sources = [...src.entries()]
    .map(([label, s]) => ({ label, ...s }))
    .sort((a, b) => b.revenue - a.revenue);

  const funnel = [
    { label: "Membuka beranda", value: visits.landing ?? 0 },
    { label: "Mencoba tema", value: visits.preview ?? 0 },
    { label: "Mulai mengisi pesanan", value: visits.pesan_mulai ?? 0 },
    { label: "Pesanan dibuat", value: created },
    { label: "Lunas (website)", value: paid.length },
    { label: "Undangan tayang", value: confirmed, note: "website + marketplace" },
    { label: "Akun pembeli dibuat", value: logins.length, note: "website + marketplace" },
  ];

  return {
    revenue,
    orders,
    aov: orders.total ? Math.round(revenue.total / orders.total) : 0,
    live: confirmed,
    series,
    bucket,
    topThemes,
    sources,
    funnel,
  };
}
