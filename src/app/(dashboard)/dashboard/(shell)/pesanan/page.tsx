import { Download } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/PageHeader";
import { DataPagination } from "@/components/data/DataPagination";
import { DataToolbar } from "@/components/data/DataToolbar";
import { listParams } from "@/components/data/list-params";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { midtransConfigured } from "@/lib/midtrans";
import { getManifest, THEME_MANIFESTS } from "@/themes/registry";

import { OrderActions } from "./OrderActions";
import { orderWhere, STATUS_FILTERS, STATUS_STYLE, type StatusFilter } from "./filters";

export const metadata: Metadata = { title: "Pesanan website" };

/** Admin: semua pesanan website (Midtrans) — filter status, cari, aksi, CSV. */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { q, page, skip, take, one } = listParams(sp);
  const st = one("status");
  const status = (STATUS_FILTERS.some((f) => f.key === st) ? st : "semua") as StatusFilter;
  const theme = THEME_MANIFESTS.some((m) => m.id === one("tema")) ? one("tema") : "";
  const where = orderWhere(status, q, theme);
  const [orders, total, counts] = await Promise.all([
    db.webOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.webOrder.count({ where }),
    db.webOrder.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (k: StatusFilter) => counts.find((c) => c.status === k)?._count ?? 0;
  const emailEnabled = emailConfigured();
  const csvQs = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(status !== "semua" ? { status } : {}),
    ...(theme ? { tema: theme } : {}),
  }).toString();

  return (
    <>
      <PageHeader
        title="Pesanan website"
        description={
          midtransConfigured()
            ? "Pembayaran lewat Midtrans. Pesanan tidak dibayar dihapus otomatis setelah 2 hari."
            : "Midtrans belum dikonfigurasi (MIDTRANS_SERVER_KEY kosong) — pembayaran online belum aktif."
        }
        actions={
          <Button asChild variant="outline">
            <a href={`/dashboard/pesanan/csv${csvQs ? `?${csvQs}` : ""}`}>
              <Download /> Unduh CSV
            </a>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <DataToolbar
            className="mb-4"
            searchPlaceholder="Cari nama, email, WA, no. pesanan"
            filters={[
              {
                key: "status",
                label: "Status",
                allLabel: "Semua status",
                options: STATUS_FILTERS.filter((f) => f.key !== "semua").map((f) => ({
                  value: f.key,
                  label: `${f.label} (${countOf(f.key)})`,
                })),
              },
              {
                key: "tema",
                label: "Tema",
                allLabel: "Semua tema",
                options: THEME_MANIFESTS.map((m) => ({ value: m.id, label: m.name })),
              },
            ]}
          />
          {orders.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {q || status !== "semua" || theme
                ? "Tidak ada pesanan yang cocok."
                : "Belum ada pesanan."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pemesan</TableHead>
                  <TableHead className="hidden md:table-cell">Pesanan</TableHead>
                  <TableHead className="hidden lg:table-cell">Waktu</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const st = STATUS_STYLE[o.status];
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="max-w-56 align-top whitespace-normal">
                        <p className="font-medium">{o.buyerName}</p>
                        <p className="text-muted-foreground text-xs break-all">{o.buyerEmail}</p>
                        {o.buyerPhone && (
                          <p className="text-muted-foreground text-xs">+{o.buyerPhone}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden align-top whitespace-normal md:table-cell">
                        <p className="font-mono text-xs">{o.midtransOrderId}</p>
                        <p className="text-muted-foreground text-xs">
                          Tema {getManifest(o.themeId)?.name ?? o.themeId}
                          {o.paymentType && ` · ${o.paymentType}`}
                        </p>
                        {o.status === "PAID" && (
                          <p className="text-xs">
                            {o.claimId ? "Link dibuat" : "Link belum dibuat"} ·{" "}
                            {o.emailSentAt ? "email terkirim" : "email belum terkirim"}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden align-top text-xs whitespace-normal lg:table-cell">
                        <p>Dibuat {formatTanggal(o.createdAt)}</p>
                        {o.paidAt && <p>Lunas {formatTanggal(o.paidAt)}</p>}
                      </TableCell>
                      <TableCell className="text-right align-top font-medium tabular-nums">
                        {formatRupiah(o.amount)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="secondary" className={st.className}>
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <OrderActions
                          id={o.id}
                          status={o.status}
                          hasClaim={!!o.claimId}
                          emailEnabled={emailEnabled}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <DataPagination
            basePath="/dashboard/pesanan"
            params={sp}
            page={page}
            total={total}
            unit="pesanan"
          />
        </CardContent>
      </Card>
    </>
  );
}
