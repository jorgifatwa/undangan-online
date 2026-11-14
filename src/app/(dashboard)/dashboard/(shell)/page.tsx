import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { SuspendedNotice } from "@/components/dashboard/SuspendedNotice";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { DRAFT_MEDIA_RETENTION_DAYS, retentionStatus } from "@/lib/invitations/retention";
import { displayStatus, summarize } from "@/lib/invitations/summary";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { invitationUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getManifest } from "@/themes/registry";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS = {
  DRAFT: { label: "Draf", className: "bg-amber-100 text-amber-900" },
  PUBLISHED: { label: "Terbit", className: "bg-emerald-100 text-emerald-900" },
  SUSPENDED: { label: "Ditangguhkan", className: "bg-red-100 text-red-900" },
} as const;

/** Daftar undangan milik user. Dashboard lengkap (statistik, tamu) menyusul. */
export default async function DashboardPage() {
  const user = await requireUser();
  const invitations = await db.invitation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      eventType: true,
      themeId: true,
      data: true,
      status: true,
      purchasedAt: true,
      suspendedAt: true,
      suspendReason: true,
      lastEditedAt: true,
      mediaPurgedAt: true,
      updatedAt: true,
      _count: { select: { media: true } },
    },
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Halo, {user.name?.split(" ")[0] ?? "kamu"} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {invitations.length === 0
              ? "Belum ada undangan. Yuk buat yang pertama!"
              : `Kamu punya ${invitations.length} undangan.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/undangan/baru">+ Buat undangan</Link>
        </Button>
      </div>

      {invitations.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {invitations.map((inv) => {
            const s = summarize(inv.eventType, inv.data);
            const manifest = getManifest(inv.themeId);
            const status = STATUS[displayStatus(inv.status, inv.suspendedAt)];
            return (
              <li key={inv.id} className="bg-card flex gap-4 rounded-2xl border p-3">
                <div
                  className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-xl"
                  style={{ background: manifest?.thumbnail.background ?? "#ddd" }}
                >
                  {/* Foto cover bila sudah diunggah; selain itu inisial di atas warna tema
                      (screenshot tema berisi nama contoh, jadi tidak dipakai di sini). */}
                  {s.cover ? (
                    <Image src={s.cover} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span
                      className="font-heading absolute inset-0 grid place-items-center text-xl"
                      style={{ color: manifest?.thumbnail.foreground ?? "#fff" }}
                    >
                      {s.initials}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium">{s.title}</p>
                    <span
                      className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs", status.className)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {s.dateLabel ?? "Tanggal belum valid"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tema {manifest?.name ?? inv.themeId} ·{" "}
                    {inv.purchasedAt
                      ? "Tema sudah dibeli"
                      : `Draf · belum dibeli${manifest ? ` (${formatRupiah(manifest.price)})` : ""}`}
                  </p>
                  {inv.suspendedAt && (
                    <SuspendedNotice reason={inv.suspendReason} slug={inv.slug} compact />
                  )}
                  {(() => {
                    const r = retentionStatus(inv, inv._count.media > 0);
                    if (!r) return null;
                    return r.kind === "warning" ? (
                      <div
                        className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-950"
                        role="alert"
                      >
                        Foto & musik undangan ini akan{" "}
                        <strong>dihapus pada {formatTanggal(r.deleteAt)}</strong> ({r.daysLeft} hari
                        lagi) karena draf ini belum dibeli dan tidak diubah selama{" "}
                        {DRAFT_MEDIA_RETENTION_DAYS} hari. Simpan perubahan di editor untuk menunda,
                        atau{" "}
                        <Link
                          href={`/dashboard/undangan/${inv.id}/edit`}
                          className="font-semibold underline"
                        >
                          beli tema
                        </Link>{" "}
                        agar foto tetap tersimpan.
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Foto & musik dihapus otomatis pada {formatTanggal(r.at)} (draf tidak diubah
                        lebih dari {DRAFT_MEDIA_RETENTION_DAYS} hari). Teks undangan tetap
                        tersimpan.
                      </p>
                    );
                  })()}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/undangan/${inv.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/undangan/${inv.id}/pratinjau`} target="_blank">
                        Pratinjau
                      </Link>
                    </Button>
                    <CopyLinkButton url={invitationUrl(inv.slug)} draft={inv.status === "DRAFT"} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
