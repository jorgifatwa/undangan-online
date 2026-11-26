"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { SETTINGS_SCHEMA, updateSettings } from "@/lib/settings";

/** Simpan pengaturan global (khusus admin). */
export async function saveSettingsAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = SETTINGS_SCHEMA.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: "Batas link 1–365 hari, masa aktif undangan 1–3650 hari." };
  await updateSettings(parsed.data);
  await db.adminAudit.create({
    data: { actor: admin.email ?? admin.id, action: "settings.update", detail: parsed.data },
  });
  revalidatePath("/dashboard/pengaturan");
  return { ok: true };
}
