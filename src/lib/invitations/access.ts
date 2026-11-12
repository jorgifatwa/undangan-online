import "server-only";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

/**
 * SATU-SATUNYA pintu untuk membaca/mengubah undangan dari dashboard & editor.
 * Undangan milik user lain diperlakukan sama dengan "tidak ada" (404), supaya
 * id undangan orang lain tidak bisa ditebak keberadaannya.
 */
export async function findOwnedInvitation(userId: string, id: string) {
  if (!id || typeof id !== "string" || id.length > 40) return null;
  return db.invitation.findFirst({ where: { id, userId } });
}

/** Untuk server component (halaman): login wajib, bukan pemilik → 404. */
export async function requireOwnedInvitation(id: string) {
  const user = await requireUser();
  const invitation = await findOwnedInvitation(user.id, id);
  if (!invitation) notFound();
  return { user, invitation };
}

/** Hasil standar server action editor (ditampilkan di UI, tidak melempar). */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { value: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
