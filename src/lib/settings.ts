import "server-only";

import { z } from "zod";

import { db } from "@/lib/db";

/**
 * PENGATURAN GLOBAL (diubah super admin, berlaku untuk semua undangan).
 * Disimpan per kunci di tabel AppSetting; kunci yang belum pernah disimpan
 * memakai nilai bawaan di bawah.
 */
export const SETTINGS_SCHEMA = z.object({
  /** Batas waktu link khusus (hari sejak dibuat). Lewat & belum dikonfirmasi → data dihapus. */
  claimLinkDays: z.coerce.number().int().min(1).max(365),
  /** Masa aktif undangan setelah dikonfirmasi (hari). Selama itu pembeli bebas mengubah data. */
  invitationActiveDays: z.coerce.number().int().min(1).max(3650),
});
export type AppSettings = z.infer<typeof SETTINGS_SCHEMA>;

export const DEFAULT_SETTINGS: AppSettings = {
  claimLinkDays: 30,
  invitationActiveDays: 365,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: Object.keys(DEFAULT_SETTINGS) } },
  });
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) merged[r.key] = r.value;
  const parsed = SETTINGS_SCHEMA.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

/** Simpan sebagian pengaturan (sudah divalidasi). Pemanggil wajib admin. */
export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = SETTINGS_SCHEMA.parse({ ...(await getSettings()), ...patch });
  await db.$transaction(
    Object.entries(patch).map(([key]) =>
      db.appSetting.upsert({
        where: { key },
        create: { key, value: next[key as keyof AppSettings] },
        update: { value: next[key as keyof AppSettings] },
      }),
    ),
  );
  return next;
}
