import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { displayStatus, summarize } from "@/lib/invitations/summary";
import { PACKAGES } from "@/lib/packages";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getManifest } from "@/themes/registry";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS = {
  DRAFT: { label: "Draf", className: "bg-amber-100 text-amber-900" },
  PUBLISHED: { label: "Terbit", className: "bg-emerald-100 text-emerald-900" },
  EXPIRED: { label: "Kedaluwarsa", className: "bg-neutral-200 text-neutral-700" },
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
      package: true,
      expiresAt: true,
      updatedAt: true,
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
            const status = STATUS[displayStatus(inv.status, inv.expiresAt)];
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
                    Tema {manifest?.name ?? inv.themeId} · Paket {PACKAGES[inv.package].label}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/undangan/${inv.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/undangan/${inv.id}/pratinjau`} target="_blank">
                        Pratinjau
                      </Link>
                    </Button>
                    <CopyLinkButton
                      url={`${siteConfig.appUrl}/u/${inv.slug}`}
                      draft={inv.status === "DRAFT"}
                    />
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
