import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/PageHeader";
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
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await requireAdmin();
  const { tab } = await searchParams;
  const emailEnabled = emailConfigured();
  const [admins, customers] = await Promise.all([
    db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 300,
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
    }),
  ]);
  const sentCounts = await db.guest.groupBy({
    by: ["invitationId"],
    where: { NOT: { sentAt: null }, invitation: { user: { role: "CUSTOMER" } } },
    _count: true,
  });
  const sentOf = (id: string) => sentCounts.find((s) => s.invitationId === id)?._count ?? 0;
  const envOnly = adminEmails().filter((e) => !admins.some((a) => a.email === e));

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akun admin dan pantau akun pembeli beserta undangannya."
      />
      <Tabs defaultValue={tab === "pembeli" ? "pembeli" : "admin"} className="gap-6">
        <TabsList>
          <TabsTrigger value="admin">Admin ({admins.length + envOnly.length})</TabsTrigger>
          <TabsTrigger value="pembeli">Pembeli ({customers.length})</TabsTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pembeli">
          <Card>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">
                  Belum ada pembeli.
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
