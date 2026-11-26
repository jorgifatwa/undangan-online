import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OwnerPreview } from "@/app/(dashboard)/dashboard/undangan/[id]/pratinjau/OwnerPreview";
import { requireCustomer } from "@/lib/auth-guard";
import { findOwnedInvitation } from "@/lib/invitations/access";

export const metadata: Metadata = { title: "Pratinjau Undangan", robots: { index: false } };

/** Pratinjau undangan milik pembeli (dipakai juga iframe editor link khusus). */
export default async function CustomerPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ to?: string | string[]; editor?: string }>;
}) {
  const { id } = await params;
  const { to, editor } = await searchParams;
  const user = await requireCustomer();
  const invitation = await findOwnedInvitation(user.id, id);
  if (!invitation) notFound();
  return <OwnerPreview invitation={invitation} to={to} editor={editor} />;
}
