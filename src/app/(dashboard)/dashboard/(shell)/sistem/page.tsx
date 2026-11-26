import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cronRuns } from "@/lib/admin/cron-log";
import { adminEmails } from "@/lib/admin-access";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { midtransConfigured } from "@/lib/midtrans";

export const metadata: Metadata = { title: "Sistem & log" };

const ACTION_LABEL: Record<string, string> = {
  "claim.create": "Buat link khusus",
  "claim.rotate": "Link khusus baru",
  "claim.revoke": "Cabut link",
  "claim.extend": "Perpanjang link",
  "claim.extendActive": "Perpanjang masa aktif",
  "claim.login": "Buat/atur akun pembeli",
  "settings.update": "Ubah pengaturan",
  "order.refresh": "Cek/proses pesanan",
  "order.resendEmail": "Kirim ulang email pesanan",
  "order.viewLink": "Lihat link pesanan",
  "user.addAdmin": "Tambah admin",
  "user.resetPassword": "Atur ulang kata sandi",
  "user.revokeAdmin": "Cabut admin",
  "admin.create": "Buat admin (CLI)",
};

const dt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

/** Admin: status konfigurasi, penyimpanan, cron, dan log aktivitas admin. */
export default async function SystemPage() {
  await requireAdmin();
  const [storage, counts, runs, logs] = await Promise.all([
    db.media.aggregate({ where: { status: "READY" }, _sum: { bytes: true }, _count: true }),
    Promise.all([
      db.invitation.count(),
      db.invitation.count({ where: { status: "PUBLISHED" } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.guest.count(),
      db.wish.count(),
    ]),
    cronRuns(),
    db.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const checks = [
    { label: "Email (SMTP)", ok: emailConfigured(), hint: "SMTP_HOST, SMTP_USER, SMTP_PASS" },
    { label: "Pembayaran (Midtrans)", ok: midtransConfigured(), hint: "MIDTRANS_SERVER_KEY" },
    { label: "Cron terlindungi", ok: Boolean(process.env.CRON_SECRET), hint: "CRON_SECRET" },
    {
      label: "Penyimpanan file",
      ok: process.env.STORAGE_DRIVER === "r2",
      hint: process.env.STORAGE_DRIVER === "r2" ? "Cloudflare R2" : "lokal (development)",
    },
    { label: "Admin lewat Google", ok: adminEmails().length > 0, hint: "ADMIN_EMAILS (opsional)" },
  ];
  const cronList = [
    { key: "media-cleanup", label: "Bersihkan file", schedule: "harian 02.00 WIB" },
    {
      key: "claims-cleanup",
      label: "Hapus link & pesanan kedaluwarsa",
      schedule: "harian 02.30 WIB",
    },
    { key: "daily-report", label: "Email ringkasan harian", schedule: "harian 07.00 WIB" },
  ];
  const [invTotal, invLive, customers, guests, wishes] = counts;

  return (
    <>
      <PageHeader title="Sistem & log" description="Kesehatan layanan dan riwayat aksi admin." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Konfigurasi</CardTitle>
            <CardDescription>Diisi lewat env server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((c) => (
              <div key={c.label} className="flex items-start gap-2.5 text-sm">
                {c.ok ? (
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-label="aktif"
                  />
                ) : (
                  <CircleX
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                    aria-label="belum aktif"
                  />
                )}
                <div>
                  <p>{c.label}</p>
                  <p className="text-muted-foreground text-xs">{c.hint}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Data</CardTitle>
            <CardDescription>Jumlah keseluruhan.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Undangan", invTotal],
                ["Tayang", invLive],
                ["Pembeli", customers],
                ["Tamu", guests],
                ["Ucapan", wishes],
                ["File tersimpan", `${storage._count} · ${mb(storage._sum.bytes ?? 0)}`],
              ].map(([l, v]) => (
                <div key={String(l)}>
                  <dt className="text-muted-foreground text-xs">{l}</dt>
                  <dd className="font-heading text-2xl tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">Tugas terjadwal</CardTitle>
            <CardDescription>Terakhir dijalankan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cronList.map((c) => {
              const run = runs[c.key];
              const stale = !run || Date.now() - Date.parse(run.at) > 36 * 3600_000;
              return (
                <div key={c.key} className="flex items-start gap-2.5 text-sm">
                  {stale ? (
                    <CircleX
                      className="mt-0.5 size-4 shrink-0 text-amber-600"
                      aria-label="belum/terlambat"
                    />
                  ) : (
                    <CircleCheck
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-label="berjalan"
                    />
                  )}
                  <div>
                    <p>{c.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {c.schedule} ·{" "}
                      {run ? `terakhir ${dt.format(new Date(run.at))}` : "belum pernah jalan"}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">Log aktivitas admin</CardTitle>
          <CardDescription>100 aksi terakhir.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Belum ada aktivitas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead className="hidden md:table-cell">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {dt.format(l.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-xs">{l.actor}</TableCell>
                    <TableCell className="text-sm">{ACTION_LABEL[l.action] ?? l.action}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-80 truncate font-mono text-[11px] md:table-cell">
                      {JSON.stringify(l.detail)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
