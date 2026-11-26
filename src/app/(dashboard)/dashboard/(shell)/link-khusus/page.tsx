import type { Metadata } from "next";
import Link from "next/link";

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

export const metadata: Metadata = { title: "Link khusus" };

const STATUS = {
  open: { label: "Menunggu diisi", className: "bg-amber-100 text-amber-900" },
  expired: { label: "Kedaluwarsa", className: "bg-zinc-200 text-zinc-700" },
  revoked: { label: "Dicabut", className: "bg-red-100 text-red-900" },
  live: { label: "Tayang", className: "bg-emerald-100 text-emerald-900" },
  ended: { label: "Masa aktif habis", className: "bg-zinc-200 text-zinc-700" },
} as const;

/** Admin: buat link khusus untuk pembeli marketplace & pantau statusnya. */
export default async function ClaimLinksPage() {
  await requireAdmin();
  const now = new Date();
  const [claims, settings] = await Promise.all([
    db.claimLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
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
    getSettings(),
  ]);
  const themes = THEME_MANIFESTS.map((m) => ({
    id: m.id,
    name: m.name,
    price: themePrice(m.id) ?? 0,
  }));

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
            ← Dashboard
          </Link>
          <h1 className="font-heading mt-1 text-3xl">Link khusus</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Untuk pembeli yang sudah membayar di marketplace. Link berlaku {settings.claimLinkDays}{" "}
            hari; masa aktif undangan setelah tayang {settings.invitationActiveDays} hari (
            <Link href="/dashboard/pengaturan" className="underline">
              ubah
            </Link>
            ).
          </p>
        </div>
      </div>

      <ClaimCreateForm themes={themes} emailEnabled={emailConfigured()} />

      <div>
        <h2 className="font-heading text-xl">Daftar link ({claims.length})</h2>
        {claims.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">Belum ada link khusus.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((c) => {
              const key =
                c.status === "REVOKED"
                  ? "revoked"
                  : c.status === "CONFIRMED"
                    ? c.invitation.activeUntil && c.invitation.activeUntil > now
                      ? "live"
                      : "ended"
                    : c.expiresAt <= now
                      ? "expired"
                      : "open";
              const st = STATUS[key];
              const theme = THEME_MANIFESTS.find((m) => m.id === c.invitation.themeId);
              return (
                <li key={c.id} className="bg-card rounded-2xl border p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {c.customerName}{" "}
                        <span className="text-muted-foreground font-mono text-xs">{c.code}</span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Tema {theme?.name ?? c.invitation.themeId} · {formatRupiah(c.price)}
                        {c.marketplace && ` · ${c.marketplace}`}
                        {c.marketplaceOrder && ` #${c.marketplaceOrder}`}
                        {c.customerPhone && ` · WA ${c.customerPhone}`}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Dibuat {formatTanggal(c.createdAt)} ·{" "}
                        {c.status === "CONFIRMED"
                          ? `Tayang ${c.confirmedAt ? formatTanggal(c.confirmedAt) : ""} · aktif s.d. ${
                              c.invitation.activeUntil
                                ? formatTanggal(c.invitation.activeUntil)
                                : "-"
                            }`
                          : `Berlaku s.d. ${formatTanggal(c.expiresAt)}`}
                        {c.lastUsedAt && ` · terakhir dibuka ${formatTanggal(c.lastUsedAt)}`}
                      </p>
                      {c.status === "CONFIRMED" && (
                        <a
                          href={invitationUrl(c.invitation.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline"
                        >
                          {invitationUrl(c.invitation.slug)}
                        </a>
                      )}
                      {c.invitation.user.email && (
                        <p className="text-xs text-emerald-800">
                          Akun pembeli: {c.invitation.user.email}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${st.className}`}>
                      {st.label}
                    </span>
                  </div>
                  <ClaimRowActions
                    claimId={c.id}
                    status={c.status}
                    expired={key === "expired"}
                    defaultEmail={c.invitation.user.email ?? c.customerEmail ?? ""}
                    hasLogin={!!c.invitation.user.email}
                    emailEnabled={emailConfigured()}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
