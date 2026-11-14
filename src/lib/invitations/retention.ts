/**
 * Retensi media (foto & musik) DRAF yang ditinggalkan:
 *   belum pernah membeli tema + tidak diubah pengguna 90 hari (lastEditedAt)
 *   → foto & musik dihapus otomatis oleh cron pembersih harian. Teks tetap.
 *   7 hari sebelumnya → peringatan di dashboard.
 * lastEditedAt hanya diisi aksi pengguna di editor (bukan cron/migrasi/admin),
 * jadi proses sistem tidak pernah memperpanjang/memperpendek hitungan.
 */
export const DRAFT_MEDIA_RETENTION_DAYS = 90;
export const RETENTION_WARNING_DAYS = 7;

const DAY = 86400_000;

interface RetentionFields {
  purchasedAt: Date | null;
  lastEditedAt: Date;
  mediaPurgedAt: Date | null;
}

/** Sudah dibersihkan dan belum diubah lagi sejak itu. */
export const isPurgedSinceEdit = (inv: RetentionFields) =>
  !!inv.mediaPurgedAt && inv.mediaPurgedAt >= inv.lastEditedAt;

/** Kapan media draf ini akan dihapus; null = tidak berlaku (sudah dibeli / sudah dibersihkan). */
export function mediaDeletionDate(inv: RetentionFields): Date | null {
  if (inv.purchasedAt || isPurgedSinceEdit(inv)) return null;
  return new Date(inv.lastEditedAt.getTime() + DRAFT_MEDIA_RETENTION_DAYS * DAY);
}

/**
 * Status retensi untuk dashboard & editor:
 *  - "warning": penghapusan ≤ 7 hari lagi
 *  - "purged": media sudah dihapus (dan belum diubah lagi sejak itu)
 *  - null: tidak relevan
 */
export function retentionStatus(
  inv: RetentionFields,
  hasMedia: boolean,
  now = new Date(),
): { kind: "warning"; deleteAt: Date; daysLeft: number } | { kind: "purged"; at: Date } | null {
  if (!inv.purchasedAt && isPurgedSinceEdit(inv)) return { kind: "purged", at: inv.mediaPurgedAt! };
  const at = mediaDeletionDate(inv);
  if (!at || !hasMedia) return null;
  const left = at.getTime() - now.getTime();
  if (left <= RETENTION_WARNING_DAYS * DAY && left > 0)
    return { kind: "warning", deleteAt: at, daysLeft: Math.max(1, Math.ceil(left / DAY)) };
  return null;
}
