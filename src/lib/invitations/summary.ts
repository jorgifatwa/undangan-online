import { eventDateLabel, firstEvent } from "@/lib/datetime";
import { parseInvitationData } from "@/schemas";
import { coupleNames } from "@/themes/_shared/format";

/**
 * Ringkasan undangan untuk daftar dashboard: judul, tanggal acara, foto
 * cover. Data rusak tidak membuat halaman gagal — ditandai saja.
 */
export function summarize(eventType: string, json: unknown) {
  const parsed = parseInvitationData(eventType, json);
  if (!parsed.ok)
    return { title: "Undangan", initials: "?", dateLabel: null, cover: null, broken: true };
  const inv = parsed.value;
  const title =
    inv.eventType === "WEDDING"
      ? coupleNames(inv.data)
      : (inv.data.celebrant.nickname ?? inv.data.celebrant.name);
  const cover =
    inv.eventType === "WEDDING"
      ? (inv.data.photos.cover?.url ?? null)
      : (inv.data.celebrant.photo?.url ?? null);
  const initials = title
    .split("&")
    .map((n) => n.trim().charAt(0).toUpperCase())
    .join("&");
  return {
    title,
    initials,
    dateLabel: eventDateLabel(firstEvent(inv.data.events)),
    cover,
    broken: false,
  };
}

/** Status yang ditampilkan: undangan terbit yang lewat masa aktif = kedaluwarsa. */
export function displayStatus(status: string, expiresAt: Date | null) {
  if (status === "PUBLISHED" && expiresAt && expiresAt < new Date()) return "EXPIRED" as const;
  return status as "DRAFT" | "PUBLISHED" | "EXPIRED";
}
