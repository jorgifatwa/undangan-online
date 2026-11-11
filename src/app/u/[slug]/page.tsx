import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { sanitizeGuestName } from "@/lib/guest";
import { getFeatures } from "@/lib/packages";
import { parseInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

/**
 * Halaman undangan publik (fallback /u/{slug}; subdomain akan di-rewrite ke sini).
 * Pembatasan fitur paket diterapkan DI SERVER lewat `features`.
 */
export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;

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
    },
  });
  if (!invitation || invitation.status !== "PUBLISHED") notFound();
  if (invitation.expiresAt && invitation.expiresAt < new Date()) notFound();

  const manifest = getManifest(invitation.themeId);
  const Theme = THEME_COMPONENTS[invitation.themeId];
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!manifest || !Theme || !parsed.ok) notFound();

  const features = getFeatures(invitation.package);
  const wishes = features.wishes
    ? await db.wish.findMany({
        where: { invitationId: invitation.id, isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { name: true, message: true, createdAt: true },
      })
    : [];

  return (
    <Theme
      invitation={parsed.value}
      variantId={invitation.colorVariant ?? undefined}
      features={features}
      watermark={features.watermark}
      guestName={sanitizeGuestName(to)}
      wishes={wishes.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }))}
    />
  );
}
