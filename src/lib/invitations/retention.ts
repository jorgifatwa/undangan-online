/**
 * Kebijakan retensi media (foto & musik) undangan paket FREE:
 *   kedaluwarsa (expiresAt) + 30 hari → dihapus otomatis oleh cron pembersih.
 *   7 hari sebelum dihapus → peringatan di dashboard + tawaran upgrade.
 * Teks undangan tidak dihapus; setelah upgrade undangan bisa aktif lagi
 * (foto perlu diunggah ulang bila sudah terhapus).
 */
export const MEDIA_RETENTION_DAYS = 30;
export const RETENTION_WARNING_DAYS = 7;

const DAY = 86400_000;

export function mediaDeletionDate(inv: { package: string; expiresAt: Date | null }): Date | null {
  if (inv.package !== "FREE" || !inv.expiresAt) return null;
  return new Date(inv.expiresAt.getTime() + MEDIA_RETENTION_DAYS * DAY);
}

/**
 * Status retensi untuk dashboard:
 *  - "warning": penghapusan ≤ 7 hari lagi (tampilkan peringatan)
 *  - "purged": media sudah dihapus
 *  - null: tidak relevan
 */
export function retentionStatus(
  inv: { package: string; expiresAt: Date | null; mediaPurgedAt: Date | null },
  hasMedia: boolean,
  now = new Date(),
): { kind: "warning"; deleteAt: Date; daysLeft: number } | { kind: "purged"; at: Date } | null {
  if (inv.mediaPurgedAt) return { kind: "purged", at: inv.mediaPurgedAt };
  const at = mediaDeletionDate(inv);
  if (!at || !hasMedia) return null;
  const left = at.getTime() - now.getTime();
  if (left <= RETENTION_WARNING_DAYS * DAY && left > 0)
    return { kind: "warning", deleteAt: at, daysLeft: Math.max(1, Math.ceil(left / DAY)) };
  return null;
}
