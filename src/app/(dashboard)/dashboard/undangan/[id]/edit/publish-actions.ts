"use server";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  PublishError,
  publishChecklist,
  publishInvitation,
  unpublishInvitation,
  type ChecklistItem,
} from "@/lib/invitations/publish";

export interface PublishState {
  status: "DRAFT" | "PUBLISHED";
  package: string;
  slug: string;
  publishedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

const view = (inv: {
  status: string;
  package: string;
  slug: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
}): PublishState => ({
  status: inv.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
  package: inv.package,
  slug: inv.slug,
  publishedAt: inv.publishedAt?.toISOString() ?? null,
  expiresAt: inv.expiresAt?.toISOString() ?? null,
  updatedAt: inv.updatedAt.toISOString(),
});

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Checklist dari data TERSIMPAN (editor menyimpan dulu sebelum membuka dialog). */
export async function checklistAction(
  id: string,
): Promise<Result<{ items: ChecklistItem[]; state: PublishState }>> {
  const user = await requireUser();
  const inv = await db.invitation.findFirst({ where: { id, userId: user.id } });
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };
  return { ok: true, items: publishChecklist(inv), state: view(inv) };
}

export async function publishAction(id: string): Promise<Result<{ state: PublishState }>> {
  const user = await requireUser();
  try {
    return { ok: true, state: view(await publishInvitation(user.id, id)) };
  } catch (e) {
    if (e instanceof PublishError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function unpublishAction(id: string): Promise<Result<{ state: PublishState }>> {
  const user = await requireUser();
  try {
    return { ok: true, state: view(await unpublishInvitation(user.id, id)) };
  } catch (e) {
    if (e instanceof PublishError) return { ok: false, error: e.message };
    throw e;
  }
}
