import "server-only";

import { db } from "@/lib/db";

import type { VisitKey } from "./keys";

/** Tanggal hari ini menurut WIB (UTC+7) sebagai Date tengah malam UTC (kolom @db.Date). */
export function wibDay(at = new Date()): Date {
  const d = new Date(at.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
  return new Date(`${d}T00:00:00Z`);
}

/** Tambah 1 hitungan (upsert atomik). */
export async function recordVisit(key: VisitKey, at = new Date()) {
  const day = wibDay(at);
  await db.pageVisit.upsert({
    where: { day_key: { day, key } },
    create: { day, key, count: 1 },
    update: { count: { increment: 1 } },
  });
}

/** Jumlah per kunci dalam rentang hari [from, to] (inklusif, tanggal WIB). */
export async function visitTotals(from: Date, to: Date) {
  const rows = await db.pageVisit.groupBy({
    by: ["key"],
    where: { day: { gte: wibDay(from), lte: wibDay(to) } },
    _sum: { count: true },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r._sum.count ?? 0])) as Partial<
    Record<VisitKey, number>
  >;
}
