import type { Metadata } from "next";
import Link from "next/link";

import type { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/admin/PageHeader";
import { DataPagination } from "@/components/data/DataPagination";
import { DataToolbar } from "@/components/data/DataToolbar";
import { listParams } from "@/components/data/list-params";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { themePrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { invitationUrl } from "@/lib/site";
import { THEME_MANIFESTS } from "@/themes/registry";

import { ClaimCreateForm } from "./ClaimCreateForm";
import { ClaimRowActions } from "./ClaimRowActions";
import { ClaimStatusBadge, claimStatusKey } from "./status";

export const metadata: Metadata = { title: "Link khusus" };

/** Admin: buat link khusus untuk pembeli marketplace & pantau statusnya. */
export default async function ClaimLinksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const now = new Date();
  const sp = await searchParams;
  const { q, page, skip, take, one } = listParams(sp);
  const status = one("status");
  const source = one("sumber");
  const digits = q.replace(/\D/g, "");
  const where: Prisma.ClaimLinkWhereInput = {
    ...(status === "open" ? { status: "OPEN", expiresAt: { gt: now } } : {}),
    ...(status === "expired" ? { status: "OPEN", expiresAt: { lte: now } } : {}),
    ...(status === "live" ? { status: "CONFIRMED", invitation: { activeUntil: { gt: now } } } : {}),
    ...(status === "ended"
      ? {
          status: "CONFIRMED",
          OR: [
            { invitation: { activeUntil: null } },
            { invitation: { activeUntil: { lte: now } } },
          ],
        }
      : {}),
    ...(status === "revoked" ? { status: "REVOKED" } : {}),
    ...(source === "WEBSITE" || source === "MARKETPLACE" ? { source } : {}),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { customerName: { contains: q, mode: "insensitive" } },
                { code: { contains: q.toUpperCase() } },
                { customerEmail: { contains: q, mode: "insensitive" } },
                ...(digits ? [{ customerPhone: { contains: digits } }] : []),
                { marketplaceOrder: { contains: q, mode: "insensitive" } },
                { invitation: { slug: { contains: q.toLowerCase() } } },
              ],
            },
          ],
        }
      : {}),
  };
  const [claims, total, settings] = await Promise.all([
    db.claimLink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        invitation: {
          select: {
            id: true,
            slug: true,
            themeId: true,
            activeUntil: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    db.claimLink.count({ where }),
    getSettings(),
  ]);
  const themes = THEME_MANIFESTS.map((m) => ({
    id: m.id,
    name: m.name,
    price: themePrice(m.id) ?? 0,
  }));
  const emailEnabled = emailConfigured();

  return (
    <>
      <PageHeader
        title="Link khusus"
        description={
          <>
            Untuk pembeli marketplace (pesanan website dibuat otomatis setelah lunas). Link berlaku{" "}
            {settings.claimLinkDays} hari; masa aktif undangan setelah tayang{" "}
            {settings.invitationActiveDays} hari.
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/pengaturan">Atur batas waktu</Link>
          </Button>
        }
      />

      <ClaimCreateForm themes={themes} emailEnabled={emailEnabled} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Daftar link</CardTitle>
          <CardDescription>Terbaru di atas.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataToolbar
            className="mb-4"
            searchPlaceholder="Cari nama, kode, WA, email, no. pesanan, alamat"
            filters={[
              {
                key: "status",
                label: "Status",
                allLabel: "Semua status",
                options: [
                  { value: "open", label: "Menunggu diisi" },
                  { value: "live", label: "Tayang" },
                  { value: "expired", label: "Kedaluwarsa" },
                  { value: "ended", label: "Masa aktif habis" },
                  { value: "revoked", label: "Dicabut" },
                ],
              },
              {
                key: "sumber",
                label: "Sumber",
                allLabel: "Semua sumber",
                options: [
                  { value: "MARKETPLACE", label: "Marketplace" },
                  { value: "WEBSITE", label: "Website" },
                ],
              },
            ]}
          />
          {claims.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {q || status || source ? "Tidak ada link yang cocok." : "Belum ada link khusus."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pembeli</TableHead>
                  <TableHead className="hidden md:table-cell">Tema & sumber</TableHead>
                  <TableHead className="hidden lg:table-cell">Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((c) => {
                  const key = claimStatusKey(c, now);
                  const theme = THEME_MANIFESTS.find((m) => m.id === c.invitation.themeId);
                  return (
                    <TableRow key={c.id} data-testid="claim-row">
                      <TableCell className="max-w-56 align-top whitespace-normal">
                        <p className="font-medium">{c.customerName}</p>
                        <p className="text-muted-foreground font-mono text-xs">{c.code}</p>
                        {c.customerPhone && (
                          <p className="text-muted-foreground text-xs">+{c.customerPhone}</p>
                        )}
                        {c.invitation.user.email && (
                          <p className="text-xs text-emerald-800">
                            Akun: {c.invitation.user.email}
                          </p>
                        )}
                        {c.status === "CONFIRMED" && (
                          <a
                            href={invitationUrl(c.invitation.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary block truncate text-xs underline-offset-4 hover:underline"
                          >
                            /{c.invitation.slug}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="hidden align-top whitespace-normal md:table-cell">
                        <p>{theme?.name ?? c.invitation.themeId}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatRupiah(c.price)}
                          {c.receivedAmount !== null &&
                            c.receivedAmount !== c.price &&
                            ` (diterima ${formatRupiah(c.receivedAmount)})`}{" "}
                          · {c.source === "WEBSITE" ? "Website" : (c.marketplace ?? "Marketplace")}
                          {c.marketplaceOrder && ` #${c.marketplaceOrder}`}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden align-top text-xs whitespace-normal lg:table-cell">
                        <p>Dibuat {formatTanggal(c.createdAt)}</p>
                        <p>
                          {c.status === "CONFIRMED"
                            ? `Aktif s.d. ${c.invitation.activeUntil ? formatTanggal(c.invitation.activeUntil) : "-"}`
                            : `Berlaku s.d. ${formatTanggal(c.expiresAt)}`}
                        </p>
                        {c.lastUsedAt && <p>Dibuka {formatTanggal(c.lastUsedAt)}</p>}
                      </TableCell>
                      <TableCell className="align-top">
                        <ClaimStatusBadge status={key} />
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <ClaimRowActions
                          claimId={c.id}
                          customerName={c.customerName}
                          status={c.status}
                          expired={key === "expired"}
                          defaultEmail={c.invitation.user.email ?? c.customerEmail ?? ""}
                          hasLogin={!!c.invitation.user.email}
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
            basePath="/dashboard/link-khusus"
            params={sp}
            page={page}
            total={total}
            unit="link"
          />
        </CardContent>
      </Card>
    </>
  );
}
