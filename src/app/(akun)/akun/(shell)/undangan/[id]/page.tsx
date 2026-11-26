import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { formatTanggal } from "@/lib/format";
import { isActive } from "@/lib/invitations/publish";
import { shareInfo } from "@/lib/invitations/share";
import { invitationUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";
import { summarize } from "@/lib/invitations/summary";

import { GuestManager } from "./GuestManager";
import { GuestbookTab } from "./GuestbookTab";

export const metadata: Metadata = { title: "Kelola undangan", robots: { index: false } };

const TABS = [
  { key: "tamu", label: "Tamu & kirim undangan" },
  { key: "ucapan", label: "Ucapan & RSVP" },
] as const;

/** Kelola satu undangan pembeli: ringkasan, ubah data, tamu & kirim, ucapan & RSVP. */
export default async function AkunInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "ucapan" ? "ucapan" : "tamu";
  const user = await requireCustomer();
  const inv = await db.invitation.findFirst({
    where: { id: String(id).slice(0, 40), userId: user.id },
    include: { claim: true },
  });
  if (!inv) notFound();
  const parsed = parseInvitationData(inv.eventType, inv.data);
  if (!parsed.ok) notFound();

  const phase = claimPhase(inv.claim, inv);
  const live = isActive(inv);
  const s = summarize(inv.eventType, inv.data);
  const many = (await db.invitation.count({ where: { userId: user.id } })) > 1;

  return (
    <section className="space-y-6">
      <div>
        {many && (
          <Link href="/akun" className="text-muted-foreground text-sm hover:underline">
            ← Undangan saya
          </Link>
        )}
        <h1 className="font-heading mt-1 text-3xl">{s.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tema {getManifest(inv.themeId)?.name ?? inv.themeId}
          {s.dateLabel && ` · ${s.dateLabel}`}
        </p>
      </div>

      <div className="bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm">
        <div className="min-w-0 flex-1">
          {live ? (
            <>
              <p className="font-medium text-emerald-800">Tayang ✓</p>
              <a
                href={invitationUrl(inv.slug)}
                target="_blank"
                rel="noreferrer"
                className="break-all underline"
              >
                {invitationUrl(inv.slug)}
              </a>
            </>
          ) : (
            <p className="font-medium">Belum tayang — selesaikan pengisian lewat link khusus.</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            {phase === "live" && inv.activeUntil
              ? `Data bisa diubah sampai ${formatTanggal(inv.activeUntil)}.`
              : phase === "locked"
                ? "Masa ubah data sudah berakhir. Hubungi admin bila perlu perubahan."
                : inv.claim
                  ? `Link khusus berlaku sampai ${formatTanggal(inv.claim.expiresAt)}.`
                  : ""}
          </p>
        </div>
        {phase === "live" && (
          <Link
            href={`/akun/undangan/${inv.id}/edit`}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium"
          >
            Ubah data undangan
          </Link>
        )}
      </div>

      <nav className="flex gap-2 border-b" aria-label="Menu undangan">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/akun/undangan/${inv.id}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === t.key
                ? "border-primary text-primary font-medium"
                : "text-muted-foreground border-transparent",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "tamu" ? (
        <GuestManager
          invitationId={inv.id}
          slug={inv.slug}
          info={shareInfo(parsed.value)}
          initialTemplate={inv.shareTemplate}
          active={live}
        />
      ) : (
        <GuestbookTab invitationId={inv.id} slug={inv.slug} />
      )}
    </section>
  );
}
