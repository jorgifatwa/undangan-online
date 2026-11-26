import "server-only";

import type { Invitation } from "@prisma/client";

import { db } from "@/lib/db";
import { activePreviewLink } from "@/lib/invitations/preview-link";
import { summarize } from "@/lib/invitations/summary";
import { invitationAddons } from "@/lib/orders/service";
import { getEntitlements } from "@/lib/pricing";
import { storage } from "@/lib/storage";
import { parseInvitationData } from "@/schemas";
import { THEME_MANIFESTS } from "@/themes/registry";

import type { EditorProps } from "./Editor";

/**
 * Props dasar Editor dari undangan (sudah dipastikan milik pemanggil).
 * Dipakai dashboard admin, link khusus (/isi) & akun pembeli (/akun).
 * null = data undangan tidak bisa dibaca.
 */
export async function loadEditorProps(invitation: Invitation): Promise<EditorProps | null> {
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!parsed.ok) return null;
  const eventType = parsed.value.eventType;
  const [library, audio, addons, previewLink] = await Promise.all([
    db.musicTrack.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, artist: true, url: true, category: true },
    }),
    db.media.findMany({
      where: {
        invitationId: invitation.id,
        kind: "AUDIO",
        status: { in: ["UPLOADING", "PROCESSING", "READY", "FAILED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    invitationAddons(invitation.id),
    activePreviewLink(invitation.id),
  ]);
  return {
    id: invitation.id,
    slug: invitation.slug,
    status: invitation.status,
    suspended: invitation.suspendedAt ? { reason: invitation.suspendReason } : null,
    eventType,
    purchase: {
      purchased: !!invitation.purchasedAt,
      themeCredit: invitation.themeCredit,
      ownedThemeIds: invitation.ownedThemeIds,
    },
    entitlements: getEntitlements(invitation, addons),
    themeId: invitation.themeId,
    variantId: invitation.colorVariant,
    updatedAt: invitation.updatedAt.toISOString(),
    publishedAt: invitation.publishedAt?.toISOString() ?? null,
    previewLinkExpiresAt: previewLink?.expiresAt.toISOString() ?? null,
    data: parsed.value.data as unknown as Record<string, unknown>,
    title: summarize(invitation.eventType, invitation.data).title,
    shareTemplate: invitation.shareTemplate,
    themes: THEME_MANIFESTS.filter((m) => m.eventTypes.includes(eventType)),
    library,
    uploadedAudio: audio.map((m) => ({
      id: m.id,
      status: m.status,
      url: m.key ? storage().publicUrl(m.key) : null,
      error: m.error,
      title: "Musik saya",
    })),
  };
}
