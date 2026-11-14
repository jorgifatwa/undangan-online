"use server";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { createPreviewLink, revokePreviewLinks } from "@/lib/invitations/preview-link";
import { siteConfig } from "@/lib/site";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

async function owned(userId: string, id: string) {
  return db.invitation.findFirst({
    where: { id, userId },
    select: { id: true, suspendedAt: true },
  });
}

/** Buat link pratinjau baru (link lama otomatis tidak berlaku). URL hanya ditampilkan sekali. */
export async function createPreviewLinkAction(
  id: string,
): Promise<Result<{ url: string; expiresAt: string }>> {
  const user = await requireUser();
  const inv = await owned(user.id, id);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };
  if (inv.suspendedAt)
    return { ok: false, error: "Undangan ditangguhkan; link pratinjau tidak bisa dibuat." };
  const { token, expiresAt } = await createPreviewLink(inv.id);
  return { ok: true, url: `${siteConfig.appUrl}/p/${token}`, expiresAt: expiresAt.toISOString() };
}

export async function revokePreviewLinkAction(id: string): Promise<Result<{ revoked: number }>> {
  const user = await requireUser();
  const inv = await owned(user.id, id);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };
  return { ok: true, revoked: await revokePreviewLinks(inv.id) };
}
