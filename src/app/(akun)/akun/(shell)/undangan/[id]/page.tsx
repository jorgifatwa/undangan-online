import type { Metadata } from "next";
import { MessagesSquare, PenLine, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { formatTanggal } from "@/lib/format";
import { isActive } from "@/lib/invitations/publish";
import { shareInfo } from "@/lib/invitations/share";
import { invitationUrl } from "@/lib/site";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";
import { summarize } from "@/lib/invitations/summary";

import { GuestManager } from "./GuestManager";
import { GuestbookTab } from "./GuestbookTab";

export const metadata: Metadata = { title: "Kelola undangan", robots: { index: false } };

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
    <>
      <div className="space-y-1">
        {many && (
          <Link href="/akun" className="text-muted-foreground text-sm hover:underline">
            ← Undangan saya
          </Link>
        )}
        <PageHeader
          title={s.title}
          description={`Tema ${getManifest(inv.themeId)?.name ?? inv.themeId}${s.dateLabel ? ` · ${s.dateLabel}` : ""}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Status undangan</CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2 font-sans text-base font-medium">
            {live ? (
              <Badge className="bg-emerald-100 text-emerald-900">Tayang</Badge>
            ) : (
              <Badge variant="secondary">Belum tayang</Badge>
            )}
            {live && (
              <a
                href={invitationUrl(inv.slug)}
                target="_blank"
                rel="noreferrer"
                className="text-primary break-all underline-offset-4 hover:underline"
              >
                {invitationUrl(inv.slug)}
              </a>
            )}
          </CardTitle>
          {phase === "live" && (
            <CardAction>
              <Button asChild>
                <Link href={`/akun/undangan/${inv.id}/edit`}>
                  <PenLine /> Ubah data undangan
                </Link>
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {phase === "live" && inv.activeUntil
            ? `Data bisa diubah sampai ${formatTanggal(inv.activeUntil)}.`
            : phase === "locked"
              ? "Masa ubah data sudah berakhir. Hubungi admin bila perlu perubahan."
              : inv.claim
                ? `Belum tayang — selesaikan pengisian lewat link khusus (berlaku sampai ${formatTanggal(inv.claim.expiresAt)}).`
                : ""}
        </CardContent>
      </Card>

      <Tabs defaultValue={tab} className="gap-6">
        <TabsList aria-label="Menu undangan">
          <TabsTrigger value="tamu" asChild>
            <Link href={`/akun/undangan/${inv.id}?tab=tamu`} scroll={false}>
              <Users /> Tamu &amp; kirim undangan
            </Link>
          </TabsTrigger>
          <TabsTrigger value="ucapan" asChild>
            <Link href={`/akun/undangan/${inv.id}?tab=ucapan`} scroll={false}>
              <MessagesSquare /> Ucapan &amp; RSVP
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tamu">
          <GuestManager
            invitationId={inv.id}
            slug={inv.slug}
            info={shareInfo(parsed.value)}
            initialTemplate={inv.shareTemplate}
            active={live}
          />
        </TabsContent>
        <TabsContent value="ucapan">
          <GuestbookTab invitationId={inv.id} slug={inv.slug} />
        </TabsContent>
      </Tabs>
    </>
  );
}
