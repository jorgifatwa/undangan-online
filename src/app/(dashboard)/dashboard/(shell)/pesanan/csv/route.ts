import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getManifest } from "@/themes/registry";

import { orderWhere, STATUS_FILTERS, type StatusFilter } from "../filters";

/** GET /dashboard/pesanan/csv?status=&q= — ekspor pesanan website (khusus admin). */
export const runtime = "nodejs";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // cegah formula injection di Excel/Sheets
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const iso = (d: Date | null) =>
  d ? new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16).replace("T", " ") : "";

export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const st = url.searchParams.get("status") ?? "semua";
  const status = (STATUS_FILTERS.some((f) => f.key === st) ? st : "semua") as StatusFilter;
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const orders = await db.webOrder.findMany({
    where: orderWhere(status, q, (url.searchParams.get("tema") ?? "").slice(0, 40)),
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const rows = [
    [
      "No. pesanan",
      "Dibuat (WIB)",
      "Lunas (WIB)",
      "Status",
      "Nominal",
      "Metode",
      "Tema",
      "Nama",
      "Email",
      "WhatsApp",
      "Email link terkirim",
    ],
    ...orders.map((o) => [
      o.midtransOrderId,
      iso(o.createdAt),
      iso(o.paidAt),
      o.status,
      o.amount,
      o.paymentType ?? "",
      getManifest(o.themeId)?.name ?? o.themeId,
      o.buyerName,
      o.buyerEmail,
      o.buyerPhone ?? "",
      o.emailSentAt ? "ya" : "",
    ]),
  ];
  const body = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pesanan-website-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
