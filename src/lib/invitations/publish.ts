import "server-only";

import type { Invitation } from "@prisma/client";

import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { isPurchased, ownsTheme, quoteTheme, themePrice } from "@/lib/pricing";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";

import { isValidSlug } from "./slug";

/**
 * Terbitkan / batalkan terbit undangan.
 *
 * Draf gratis tanpa batas waktu; TERBIT hanya setelah tema dibeli (dicek di
 * server). Setelah terbit: aktif minimal 12 bulan setelah acara dan tetap dapat
 * diakses selama layanan berjalan (PAID_ACTIVE) — tidak ada kedaluwarsa.
 * Undangan DITANGGUHKAN admin (suspendedAt) tidak tampil ke tamu dan tidak bisa
 * diterbitkan / dibatalkan terbitnya oleh pemilik.
 */

export interface ChecklistItem {
  key: "names" | "event" | "eventDate" | "slug" | "purchase" | "theme" | "suspended";
  label: string;
  ok: boolean;
  /** Peringatan tidak menghalangi terbit. */
  severity: "error" | "warning";
  message?: string;
}

/** true bila undangan bisa dibuka tamu sekarang. */
export function isActive(inv: Pick<Invitation, "status" | "suspendedAt">) {
  return inv.status === "PUBLISHED" && !inv.suspendedAt;
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

  // Syarat terbit: tema sudah dibeli.
  const manifest = getManifest(inv.themeId);
  const price = themePrice(inv.themeId);
  items.push({
    key: "purchase",
    label: "Tema sudah dibeli",
    ok: isPurchased(inv),
    severity: "error",
    message: isPurchased(inv)
      ? undefined
      : `Undangan bisa diterbitkan setelah tema ${manifest?.name ?? ""} dibeli${price ? ` (${formatRupiah(price)})` : ""}. Draf tetap bisa diisi & dipratinjau gratis.`,
  });

  // Sudah membeli: tema yang dipakai harus sudah dibayar (pindah ke tema lebih
  // mahal → bayar selisih dulu).
  const quote = manifest ? quoteTheme(inv, inv.themeId) : null;
  const themeOk = !!manifest && (!isPurchased(inv) || ownsTheme(inv, inv.themeId));
  if (isPurchased(inv) || !manifest)
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

  if (inv.suspendedAt)
    items.push({
      key: "suspended",
      label: "Undangan tidak ditangguhkan",
      ok: false,
      severity: "error",
      message: `Undangan ini ditangguhkan admin${inv.suspendReason ? `: ${inv.suspendReason}` : ""}. Hubungi kami untuk banding.`,
    });
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
  return db.invitation.update({
    where: { id: inv.id },
    data: { status: "PUBLISHED", publishedAt },
  });
}

/** Kembali ke draf (tema yang sudah dibeli tetap dimiliki; bisa terbit lagi). */
export async function unpublishInvitation(userId: string, id: string) {
  const inv = await db.invitation.findFirst({ where: { id, userId } });
  if (!inv) throw new PublishError("Undangan tidak ditemukan.");
  if (inv.suspendedAt)
    throw new PublishError("Undangan ini ditangguhkan admin. Hubungi kami untuk banding.");
  return db.invitation.update({ where: { id: inv.id }, data: { status: "DRAFT" } });
}
