import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";

import { db } from "@/lib/db";
import { sanitizeGuestName } from "@/lib/guest";
import { guestbookStats } from "@/lib/guestbook/service";
import { getFeatures } from "@/lib/packages";
import { parseInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

import { Expired } from "./Expired";

/** Berisi data pribadi → jangan diindeks mesin pencari (lihat juga header X-Robots-Tag). */
export const metadata: Metadata = { robots: { index: false, follow: false } };
/** Selalu dirender dari database: perubahan setelah terbit langsung tampil. */
export const dynamic = "force-dynamic";

/**
 * Halaman undangan publik (fallback /u/{slug}; subdomain akan di-rewrite ke sini).
 * Draf → 404. Masa aktif habis → halaman "tidak aktif" tanpa data pribadi.
 * Pembatasan fitur paket diterapkan DI SERVER lewat `features`.
 */
export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[]; lite?: string }>;
}) {
  const { slug } = await params;
  const { to, lite } = await searchParams;

  const invitation = await db.invitation.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      themeId: true,
      colorVariant: true,
      eventType: true,
      data: true,
      package: true,
      expiresAt: true,
      userId: true,
    },
  });
  if (!invitation || invitation.status !== "PUBLISHED") notFound();
  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    const session = await auth();
    return <Expired owner={session?.user?.id === invitation.userId} invitationId={invitation.id} />;
  }

  const manifest = getManifest(invitation.themeId);
  const Theme = THEME_COMPONENTS[invitation.themeId];
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!manifest || !Theme || !parsed.ok) notFound();

  const features = getFeatures(invitation.package);
  const [wishes, stats] = await Promise.all([
    features.wishes
      ? db.wish.findMany({
          where: { invitationId: invitation.id, isHidden: false },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, name: true, message: true, attendance: true, createdAt: true },
        })
      : [],
    guestbookStats(invitation.id),
  ]);

  return (
    <Theme
      invitation={parsed.value}
      variantId={invitation.colorVariant ?? undefined}
      features={features}
      watermark={features.watermark}
      guestName={sanitizeGuestName(to)}
      forceLite={lite === "1"}
      wishes={wishes.map((w) => ({
        ...w,
        attendance: w.attendance ?? undefined,
        createdAt: w.createdAt.toISOString(),
      }))}
      guestbook={{ slug, stats }}
    />
  );
}
