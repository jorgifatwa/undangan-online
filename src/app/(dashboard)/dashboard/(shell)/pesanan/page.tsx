import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { getManifest } from "@/themes/registry";

import { OrderActions } from "./OrderActions";
import { orderWhere, STATUS_FILTERS, STATUS_STYLE, type StatusFilter } from "./filters";

export const metadata: Metadata = { title: "Pesanan website" };

/** Admin: semua pesanan website (Midtrans) — filter status, cari, aksi, CSV. */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (
    STATUS_FILTERS.some((f) => f.key === sp.status) ? sp.status : "semua"
  ) as StatusFilter;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const [orders, counts] = await Promise.all([
    db.webOrder.findMany({
      where: orderWhere(status, q),
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.webOrder.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (k: StatusFilter) =>
    k === "semua"
      ? counts.reduce((s, c) => s + c._count, 0)
      : (counts.find((c) => c.status === k)?._count ?? 0);
  const emailEnabled = emailConfigured();
  const qs = (patch: Record<string, string>) =>
    `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status !== "semua" ? { status } : {}), ...patch })}`;

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
            <a href={`/dashboard/pesanan/csv${qs({})}`}>
              <Download /> Unduh CSV
            </a>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-muted flex flex-wrap rounded-lg p-[3px]">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              asChild
              size="sm"
              variant="ghost"
              className={cn(status === f.key ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <Link
                href={`/dashboard/pesanan${qs({ status: f.key === "semua" ? "" : f.key })}`.replace(
                  /status=&?/,
                  "",
                )}
              >
                {f.label}
                <span className="text-muted-foreground text-xs tabular-nums">{countOf(f.key)}</span>
              </Link>
            </Button>
          ))}
        </div>
        <form className="relative ml-auto w-full max-w-xs" action="/dashboard/pesanan">
          {status !== "semua" && <input type="hidden" name="status" value={status} />}
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, email, no. pesanan"
            className="pl-8"
          />
        </form>
      </div>

      <Card>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">Belum ada pesanan.</p>
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
        </CardContent>
      </Card>
    </>
  );
}
