import type { Metadata } from "next";

import { requireOwnedInvitation } from "@/lib/invitations/access";

import { OwnerPreview } from "./OwnerPreview";

export const metadata: Metadata = { title: "Pratinjau Undangan", robots: { index: false } };

/** Pratinjau undangan milik admin yang login. Undangan orang lain → 404. */
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
  return <OwnerPreview invitation={invitation} to={to} editor={editor} />;
}
