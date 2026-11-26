import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <>
      <PageHeader title="Undangan saya" />
      {invitations.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Belum ada undangan di akun ini. Hubungi admin bila ini keliru.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {invitations.map((inv) => {
            const s = summarize(inv.eventType, inv.data);
            const phase = claimPhase(inv.claim, inv);
            return (
              <Card key={inv.id}>
                <CardHeader>
                  <CardTitle className="font-heading text-xl font-normal">{s.title}</CardTitle>
                  <CardDescription>
                    Tema {getManifest(inv.themeId)?.name ?? inv.themeId} ·{" "}
                    {inv.status === "PUBLISHED" ? invitationUrl(inv.slug) : "belum tayang"}
                    {inv.activeUntil && ` · aktif s.d. ${formatTanggal(inv.activeUntil)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm">
                    <Link href={`/akun/undangan/${inv.id}`}>
                      {phase === "locked" ? "Lihat" : "Kelola"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
