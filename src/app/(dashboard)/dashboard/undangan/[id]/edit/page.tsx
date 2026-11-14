import type { Metadata } from "next";

import { db } from "@/lib/db";
import { requireOwnedInvitation } from "@/lib/invitations/access";
import { activePreviewLink } from "@/lib/invitations/preview-link";
import { invitationAddons } from "@/lib/orders/service";
import { getEntitlements } from "@/lib/pricing";
import { storage } from "@/lib/storage";
import { summarize } from "@/lib/invitations/summary";
import { parseInvitationData } from "@/schemas";
import { THEME_MANIFESTS } from "@/themes/registry";

import { Editor } from "./Editor";

export const metadata: Metadata = { title: "Edit Undangan", robots: { index: false } };

/** Editor undangan (pemilik saja). Semua penyimpanan dicek ulang di server action. */
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invitation } = await requireOwnedInvitation(id);
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!parsed.ok) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-heading text-2xl">Data undangan tidak bisa dibaca</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Hubungi bantuan dengan menyertakan id {invitation.id}.
        </p>
      </main>
    );
  }
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
  return (
    <Editor
      id={invitation.id}
      slug={invitation.slug}
      status={invitation.status}
      suspended={invitation.suspendedAt ? { reason: invitation.suspendReason } : null}
      eventType={eventType}
      purchase={{
        purchased: !!invitation.purchasedAt,
        themeCredit: invitation.themeCredit,
        ownedThemeIds: invitation.ownedThemeIds,
      }}
      entitlements={getEntitlements(invitation, addons)}
      themeId={invitation.themeId}
      variantId={invitation.colorVariant}
      updatedAt={invitation.updatedAt.toISOString()}
      publishedAt={invitation.publishedAt?.toISOString() ?? null}
      previewLinkExpiresAt={previewLink?.expiresAt.toISOString() ?? null}
      data={parsed.value.data as unknown as Record<string, unknown>}
      title={summarize(invitation.eventType, invitation.data).title}
      shareTemplate={invitation.shareTemplate}
      themes={THEME_MANIFESTS.filter((m) => m.eventTypes.includes(eventType))}
      library={library}
      uploadedAudio={audio.map((m) => ({
        id: m.id,
        status: m.status,
        url: m.key ? storage().publicUrl(m.key) : null,
        error: m.error,
        title: "Musik saya",
      }))}
    />
  );
}
