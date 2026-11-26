import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { formatTanggal } from "@/lib/format";
import { summarize } from "@/lib/invitations/summary";
import { invitationUrl } from "@/lib/site";
import { getManifest } from "@/themes/registry";

export const metadata: Metadata = { title: "Undangan saya", robots: { index: false } };

/** Dashboard pembeli: undangan miliknya (biasanya satu → langsung dibuka). */
export default async function AkunPage() {
  const user = await requireCustomer();
  const invitations = await db.invitation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { claim: true },
  });
  if (invitations.length === 1) redirect(`/akun/undangan/${invitations[0].id}`);

  return (
    <section>
      <h1 className="font-heading text-3xl">Undangan saya</h1>
      {invitations.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          Belum ada undangan di akun ini. Hubungi admin bila ini keliru.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {invitations.map((inv) => {
            const s = summarize(inv.eventType, inv.data);
            const phase = claimPhase(inv.claim, inv);
            return (
              <li key={inv.id} className="bg-card rounded-2xl border p-4">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground text-xs">
                  Tema {getManifest(inv.themeId)?.name ?? inv.themeId} ·{" "}
                  {inv.status === "PUBLISHED" ? invitationUrl(inv.slug) : "belum tayang"}
                  {inv.activeUntil && ` · aktif s.d. ${formatTanggal(inv.activeUntil)}`}
                </p>
                <Link
                  href={`/akun/undangan/${inv.id}`}
                  className="mt-3 inline-block text-sm font-medium underline"
                >
                  {phase === "locked" ? "Lihat" : "Kelola"} →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
