import "server-only";

import type { Invitation } from "@prisma/client";

import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { isPurchased, ownsTheme, quoteTheme, TRIAL_DAYS } from "@/lib/pricing";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";

import { isValidSlug } from "./slug";

/**
 * Terbitkan / batalkan terbit undangan.
 *
 * Aturan masa uji (belum membeli tema; disetujui pemilik produk):
 *  - aktif 3 hari sejak TERBIT PERTAMA (publishedAt tidak pernah di-reset)
 *  - "Batalkan terbit" TIDAK menghentikan hitungan → tidak bisa diperpanjang
 *    dengan terbit ulang; setelah lewat harus membeli tema
 * Tema sudah dibeli: expiresAt null — aktif minimal 12 bulan setelah acara dan
 * tetap dapat diakses setelahnya selama layanan berjalan (PAID_ACTIVE, lib/pricing).
 */
export const FREE_TRIAL_DAYS = TRIAL_DAYS;
const DAY = 86400_000;

export interface ChecklistItem {
  key: "names" | "event" | "eventDate" | "slug" | "theme" | "trial";
  label: string;
  ok: boolean;
  /** Peringatan tidak menghalangi terbit. */
  severity: "error" | "warning";
  message?: string;
}

/** true bila undangan bisa dibuka tamu sekarang. */
export function isActive(inv: Pick<Invitation, "status" | "expiresAt">, now = new Date()) {
  return inv.status === "PUBLISHED" && (!inv.expiresAt || inv.expiresAt > now);
}

/** Checklist sebelum terbit, dihitung dari data TERSIMPAN di server. */
export function publishChecklist(inv: Invitation, now = new Date()): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const parsed = parseInvitationData(inv.eventType, inv.data);
  const d = parsed.ok ? parsed.value : null;

  const names =
    d?.eventType === "WEDDING"
      ? !!d.data.bride.fullName && !!d.data.groom.fullName
      : d?.eventType === "BIRTHDAY"
        ? !!d.data.celebrant.name
        : false;
  items.push({
    key: "names",
    label: d?.eventType === "BIRTHDAY" ? "Nama yang berulang tahun" : "Nama kedua mempelai",
    ok: names,
    severity: "error",
    message: names ? undefined : "Lengkapi nama di bagian Mempelai / Profil.",
  });

  const events = d?.data.events ?? [];
  items.push({
    key: "event",
    label: "Minimal satu acara dengan tanggal",
    ok: events.length > 0 && events.every((e) => !!e.date),
    severity: "error",
    message: events.length ? undefined : "Tambahkan acara di bagian Acara.",
  });

  const today = now.toISOString().slice(0, 10);
  const past = events.filter((e) => e.date && e.date < today);
  items.push({
    key: "eventDate",
    label: "Tanggal acara belum lewat",
    ok: past.length === 0,
    severity: "warning",
    message: past.length ? `Tanggal "${past[0].name}" sudah lewat. Periksa kembali.` : undefined,
  });

  items.push({
    key: "slug",
    label: "Alamat undangan valid",
    ok: isValidSlug(inv.slug),
    severity: "error",
    message: isValidSlug(inv.slug)
      ? undefined
      : "Ubah alamat undangan di bagian Tema, warna & alamat.",
  });

  // Setelah membeli: tema yang dipakai harus sudah dibayar (pindah ke tema lebih
  // mahal → bayar selisih dulu). Masa uji: semua tema boleh.
  const manifest = getManifest(inv.themeId);
  const quote = manifest ? quoteTheme(inv, inv.themeId) : null;
  const themeOk = !!manifest && (!isPurchased(inv) || ownsTheme(inv, inv.themeId));
  items.push({
    key: "theme",
    label: "Tema sudah dibayar",
    ok: themeOk,
    severity: "error",
    message: themeOk
      ? undefined
      : quote?.kind === "upgrade"
        ? `Tema ${manifest!.name} lebih mahal dari tema yang sudah dibeli. Bayar selisih ${formatRupiah(quote.amount)} atau kembali ke tema sebelumnya.`
        : "Tema tidak ditemukan. Pilih tema lain.",
  });

  if (!isPurchased(inv) && inv.expiresAt && inv.expiresAt <= now) {
    items.push({
      key: "trial",
      label: "Masa uji Gratis",
      ok: false,
      severity: "error",
      message: "Masa uji 3 hari sudah berakhir. Beli tema agar undangan bisa aktif kembali.",
    });
  }
  return items;
}

export class PublishError extends Error {}

export async function publishInvitation(userId: string, id: string, now = new Date()) {
  const inv = await db.invitation.findFirst({ where: { id, userId } });
  if (!inv) throw new PublishError("Undangan tidak ditemukan.");
  const failed = publishChecklist(inv, now).filter((i) => i.severity === "error" && !i.ok);
  if (failed.length)
    throw new PublishError(failed[0].message ?? "Lengkapi checklist terlebih dahulu.");

  const publishedAt = inv.publishedAt ?? now; // terbit PERTAMA tidak berubah
  const expiresAt = isPurchased(inv)
    ? null
    : (inv.expiresAt ?? new Date(publishedAt.getTime() + FREE_TRIAL_DAYS * DAY));
  return db.invitation.update({
    where: { id: inv.id },
    data: { status: "PUBLISHED", publishedAt, expiresAt },
  });
}

/** Kembali ke draf. Masa uji FREE tetap berjalan (expiresAt tidak diubah). */
export async function unpublishInvitation(userId: string, id: string) {
  const inv = await db.invitation.findFirst({ where: { id, userId } });
  if (!inv) throw new PublishError("Undangan tidak ditemukan.");
  return db.invitation.update({ where: { id: inv.id }, data: { status: "DRAFT" } });
}
