"use server";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { MAX_TEMPLATE } from "@/lib/invitations/share";

/**
 * Simpan template pesan WhatsApp. null / kosong = kembali ke template bawaan.
 * Disimpan di kolom terpisah (bukan `data`) sehingga tidak bentrok dengan autosave.
 */
export async function saveShareTemplateAction(
  invitationId: string,
  template: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const value = template?.replace(/\r\n/g, "\n").trim() || null;
  if (value && value.length > MAX_TEMPLATE)
    return { ok: false, error: `Template maksimal ${MAX_TEMPLATE} karakter.` };
  const inv = await db.invitation.findFirst({
    where: { id: invitationId, userId: user.id },
    select: { id: true, updatedAt: true },
  });
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };
  await db.invitation.update({
    where: { id: inv.id },
    // updatedAt dipertahankan: Prisma otomatis memperbaruinya, padahal editor
    // memakainya untuk deteksi konflik autosave (dan versi gambar pratinjau link).
    data: { shareTemplate: value, updatedAt: inv.updatedAt },
  });
  return { ok: true };
}
