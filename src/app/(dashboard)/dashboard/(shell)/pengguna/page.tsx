import type { Metadata } from "next";
import Link from "next/link";

import type { Prisma } from "@prisma/client";

import { PageHeader } from "@/components/admin/PageHeader";
import { DataPagination } from "@/components/data/DataPagination";
import { DataToolbar } from "@/components/data/DataToolbar";
import { listParams } from "@/components/data/list-params";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminEmails, isAdminEmail } from "@/lib/admin-access";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { formatTanggal } from "@/lib/format";
import { summarize } from "@/lib/invitations/summary";

import { AddAdminForm, UserActions } from "./UserControls";

export const metadata: Metadata = { title: "Pengguna" };

/** Admin: kelola akun admin & pantau akun pembeli. */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const { q, page, skip, take, one } = listParams(sp);
  const tab = one("tab") === "pembeli" ? "pembeli" : "admin";
  const emailEnabled = emailConfigured();
  const envList = adminEmails();
  const masuk = one("masuk");
  const adminWhere: Prisma.UserWhereInput = {
    role: "ADMIN",
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(masuk === "sandi" ? { passwordHash: { not: null } } : {}),
    ...(masuk === "google" ? { email: { in: envList } } : {}),
  };
  const st = one("status");
  const akun = one("akun");
  const customerWhere: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { invitations: { some: { slug: { contains: q.toLowerCase() } } } },
            { invitations: { some: { claim: { code: { contains: q.toUpperCase() } } } } },
          ],
        }
      : {}),
    ...(st === "tayang" ? { invitations: { some: { status: "PUBLISHED" } } } : {}),
    ...(st === "belum" ? { invitations: { none: { status: "PUBLISHED" } } } : {}),
    ...(akun === "ada" ? { email: { not: null } } : {}),
    ...(akun === "belum" ? { email: null } : {}),
  };
  const [admins, adminTotal, adminAll, customers, customerTotal, customerAll, dbAdminEmails] =
    await Promise.all([
      tab === "admin"
        ? db.user.findMany({ where: adminWhere, orderBy: { createdAt: "asc" }, skip, take })
        : Promise.resolve([]),
      db.user.count({ where: adminWhere }),
      db.user.count({ where: { role: "ADMIN" } }),
      tab === "pembeli"
        ? db.user.findMany({
            where: customerWhere,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: {
              invitations: {
                select: {
                  id: true,
                  slug: true,
                  status: true,
                  eventType: true,
                  data: true,
                  activeUntil: true,
                  claim: { select: { status: true, code: true } },
                  _count: { select: { guests: true, wishes: true, rsvps: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      db.user.count({ where: customerWhere }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.findMany({
        where: { role: "ADMIN", email: { in: envList } },
        select: { email: true },
      }),
    ]);
  const invIds = customers.flatMap((c) => c.invitations.map((i) => i.id));
  const sentCounts = invIds.length
    ? await db.guest.groupBy({
        by: ["invitationId"],
        where: { NOT: { sentAt: null }, invitationId: { in: invIds } },
        _count: true,
      })
    : [];
  const sentOf = (id: string) => sentCounts.find((s) => s.invitationId === id)?._count ?? 0;
  // Admin lewat ADMIN_EMAILS yang belum pernah masuk (belum ada di database)
  const envOnly =
    page === 1 && masuk !== "sandi"
      ? envList.filter(
          (e) => !dbAdminEmails.some((a) => a.email === e) && (!q || e.includes(q.toLowerCase())),
        )
      : [];
  const tabHref = (t: string) => `/dashboard/pengguna${t === "pembeli" ? "?tab=pembeli" : ""}`;

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akun admin dan pantau akun pembeli beserta undangannya."
      />
      <Tabs value={tab} className="gap-6">
        <TabsList>
          <TabsTrigger value="admin" asChild>
            <Link href={tabHref("admin")}>Admin ({adminAll + envOnly.length})</Link>
          </TabsTrigger>
          <TabsTrigger value="pembeli" asChild>
            <Link href={tabHref("pembeli")}>Pembeli ({customerAll})</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl font-normal">Tambah admin</CardTitle>
              <CardDescription>
                Admin baru masuk dengan email & kata sandi acak (ditampilkan sekali, kirim lewat
                WhatsApp/email). Semua admin bisa melihat seluruh data & laporan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddAdminForm emailEnabled={emailEnabled} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <DataToolbar
                className="mb-4"
                searchPlaceholder="Cari nama atau email admin"
                filters={[
                  {
                    key: "masuk",
                    label: "Cara masuk",
                    allLabel: "Semua cara masuk",
                    options: [
                      { value: "sandi", label: "Email & kata sandi" },
                      { value: "google", label: "Google (ADMIN_EMAILS)" },
                    ],
                  },
                ]}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Cara masuk</TableHead>
                    <TableHead className="hidden md:table-cell">Sejak</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium">
                          {a.name ?? "—"}{" "}
                          {a.id === me.id && <Badge variant="secondary">Anda</Badge>}
                        </p>
                        <p className="text-muted-foreground text-xs">{a.email}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {[
                          a.passwordHash ? "Email & kata sandi" : null,
                          isAdminEmail(a.email) ? "Google (ADMIN_EMAILS)" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                        {formatTanggal(a.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          userId={a.id}
                          name={a.name ?? a.email ?? "admin"}
                          role="ADMIN"
                          hasEmail={!!a.email}
                          canRevoke={a.id !== me.id && !isAdminEmail(a.email)}
                          emailEnabled={emailEnabled}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {envOnly.map((e) => (
                    <TableRow key={e}>
                      <TableCell>
                        <p className="font-medium">—</p>
                        <p className="text-muted-foreground text-xs">{e}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        Google (ADMIN_EMAILS) · belum pernah masuk
                      </TableCell>
                      <TableCell className="hidden md:table-cell" />
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataPagination
                basePath="/dashboard/pengguna"
                params={sp}
                page={page}
                total={adminTotal}
                unit="admin"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pembeli">
          <Card>
            <CardContent>
              <DataToolbar
                className="mb-4"
                searchPlaceholder="Cari nama, email, alamat undangan, kode link"
                filters={[
                  {
                    key: "status",
                    label: "Status undangan",
                    allLabel: "Semua undangan",
                    options: [
                      { value: "tayang", label: "Sudah tayang" },
                      { value: "belum", label: "Belum tayang" },
                    ],
                  },
                  {
                    key: "akun",
                    label: "Akun login",
                    allLabel: "Semua akun",
                    options: [
                      { value: "ada", label: "Sudah punya login" },
                      { value: "belum", label: "Belum punya login" },
                    ],
                  },
                ]}
              />
              {customers.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">
                  {q || st || akun ? "Tidak ada pembeli yang cocok." : "Belum ada pembeli."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pembeli</TableHead>
                      <TableHead>Undangan</TableHead>
                      <TableHead className="hidden text-right lg:table-cell">Tamu</TableHead>
                      <TableHead className="hidden text-right lg:table-cell">Terkirim</TableHead>
                      <TableHead className="hidden text-right lg:table-cell">RSVP</TableHead>
                      <TableHead className="hidden text-right lg:table-cell">Ucapan</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => {
                      const inv = c.invitations[0];
                      const live = inv?.status === "PUBLISHED";
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="max-w-52 align-top whitespace-normal">
                            <p className="font-medium">{c.name ?? "—"}</p>
                            <p className="text-muted-foreground text-xs">
                              {c.email ?? "Belum ada akun login"}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-64 align-top whitespace-normal">
                            {inv ? (
                              <>
                                <p className="truncate">
                                  {summarize(inv.eventType, inv.data).title}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {live ? (
                                    <Link
                                      href={`/${inv.slug}`}
                                      target="_blank"
                                      className="underline-offset-4 hover:underline"
                                    >
                                      /{inv.slug}
                                    </Link>
                                  ) : (
                                    "Belum tayang"
                                  )}
                                  {inv.claim && ` · ${inv.claim.code}`}
                                  {inv.activeUntil &&
                                    ` · aktif s.d. ${formatTanggal(inv.activeUntil)}`}
                                </p>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-right align-top tabular-nums lg:table-cell">
                            {inv?._count.guests ?? 0}
                          </TableCell>
                          <TableCell className="hidden text-right align-top tabular-nums lg:table-cell">
                            {inv ? sentOf(inv.id) : 0}
                          </TableCell>
                          <TableCell className="hidden text-right align-top tabular-nums lg:table-cell">
                            {inv?._count.rsvps ?? 0}
                          </TableCell>
                          <TableCell className="hidden text-right align-top tabular-nums lg:table-cell">
                            {inv?._count.wishes ?? 0}
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <UserActions
                              userId={c.id}
                              name={c.name ?? "pembeli"}
                              role="CUSTOMER"
                              hasEmail={!!c.email}
                              canRevoke={false}
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
                basePath="/dashboard/pengguna"
                params={sp}
                page={page}
                total={customerTotal}
                unit="pembeli"
              />
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-3 text-xs">
            Akun login pembeli dibuat dari menu Link khusus setelah undangan tayang.
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}
