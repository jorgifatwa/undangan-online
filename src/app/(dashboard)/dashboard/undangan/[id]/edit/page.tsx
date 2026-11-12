import type { Metadata } from "next";

import { requireOwnedInvitation } from "@/lib/invitations/access";
import { displayStatus, summarize } from "@/lib/invitations/summary";
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
  return (
    <Editor
      id={invitation.id}
      slug={invitation.slug}
      status={displayStatus(invitation.status, invitation.expiresAt)}
      eventType={eventType}
      pkg={invitation.package}
      themeId={invitation.themeId}
      variantId={invitation.colorVariant}
      updatedAt={invitation.updatedAt.toISOString()}
      data={parsed.value.data as unknown as Record<string, unknown>}
      title={summarize(invitation.eventType, invitation.data).title}
      themes={THEME_MANIFESTS.filter((m) => m.eventTypes.includes(eventType))}
    />
  );
}
