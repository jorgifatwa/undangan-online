import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { sanitizeGuestName } from "@/lib/guest";
import { requireOwnedInvitation } from "@/lib/invitations/access";
import { invitationAddons } from "@/lib/orders/service";
import { getEntitlements } from "@/lib/pricing";
import { parseInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";
import { withPhotoPlaceholders } from "@/lib/editor/placeholders";

import { EditorPreview } from "./EditorPreview";

export const metadata: Metadata = { title: "Pratinjau Undangan", robots: { index: false } };

/**
 * Pratinjau undangan milik user (termasuk draf) dengan komponen tema yang SAMA
 * dengan halaman publik /[slug] dan hak pakai undangan itu.
 * Hanya pemilik — undangan orang lain → 404.
 */
export default async function PratinjauPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ to?: string | string[]; editor?: string }>;
}) {
  const { id } = await params;
  const { to, editor } = await searchParams;
  const { invitation } = await requireOwnedInvitation(id);

  const manifest = getManifest(invitation.themeId);
  const Theme = THEME_COMPONENTS[invitation.themeId];
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!manifest || !Theme || !parsed.ok) notFound();

  // Pratinjau PEMILIK: semua fitur terlihat (lihat getEntitlements).
  const features = getEntitlements(invitation, await invitationAddons(invitation.id));

  // Mode editor (iframe di halaman edit): data diperbarui lewat postMessage.
  if (editor === "1") {
    return (
      <EditorPreview
        initial={{
          themeId: invitation.themeId,
          variantId: invitation.colorVariant,
          invitation: parsed.value,
        }}
        eventType={parsed.value.eventType}
        features={features}
      />
    );
  }
  const wishes = features.wishes
    ? await db.wish.findMany({
        where: { invitationId: invitation.id, isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { name: true, message: true, createdAt: true },
      })
    : [];

  return (
    <>
      <Theme
        // slot foto kosong → penanda "Belum ada foto" (hanya pratinjau pemilik)
        invitation={withPhotoPlaceholders(parsed.value)}
        variantId={invitation.colorVariant ?? undefined}
        features={features}
        guestName={sanitizeGuestName(to)}
        wishes={wishes.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }))}
        preview
      />
      {invitation.status === "DRAFT" && (
        <p className="pointer-events-none fixed bottom-3 left-3 z-[200] rounded-full bg-black/70 px-3 py-1 font-sans text-xs text-white">
          Pratinjau · draf belum terbit
        </p>
      )}
    </>
  );
}
