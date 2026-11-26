import "server-only";

import type { ClaimLink, Invitation, UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { themePrice } from "@/lib/pricing";

/**
 * Aturan pembeli (role CUSTOMER) atas undangannya. Admin tidak dibatasi aturan
 * ini (tetap dibatasi kepemilikan & aturan umum editor).
 *  - Link OPEN & belum kedaluwarsa → boleh ubah data & ganti tema BERHARGA SAMA.
 *  - CONFIRMED (tayang)           → tema terkunci; ubah data selama masa aktif.
 *  - REVOKED / kedaluwarsa / masa aktif habis / tanpa link → hanya-baca.
 */
export type ClaimPhase = "open" | "live" | "locked";

export function claimPhase(
  claim: Pick<ClaimLink, "status" | "expiresAt"> | null,
  inv: Pick<Invitation, "activeUntil">,
  now = new Date(),
): ClaimPhase {
  if (!claim) return "locked";
  if (claim.status === "OPEN") return claim.expiresAt > now ? "open" : "locked";
  if (claim.status === "CONFIRMED")
    return inv.activeUntil && inv.activeUntil > now ? "live" : "locked";
  return "locked";
}

export const LOCKED_MESSAGE =
  "Undangan ini tidak bisa diubah lagi (link kedaluwarsa atau masa aktif habis). Hubungi admin.";

/**
 * Periksa apakah `role` boleh mengubah undangan `inv` (sudah dipastikan
 * miliknya). Kembalikan pesan galat, atau null bila boleh.
 * `nextThemeId` diisi saat menyimpan (cek ganti tema).
 */
export async function customerEditError(
  role: UserRole,
  inv: Pick<Invitation, "id" | "themeId" | "activeUntil">,
  nextThemeId?: string,
  now = new Date(),
): Promise<string | null> {
  if (role !== "CUSTOMER") return null;
  const claim = await db.claimLink.findUnique({ where: { invitationId: inv.id } });
  const phase = claimPhase(claim, inv, now);
  if (phase === "locked") return LOCKED_MESSAGE;
  if (nextThemeId && nextThemeId !== inv.themeId) {
    if (phase === "live") return "Tema sudah terkunci setelah undangan tayang.";
    if (themePrice(nextThemeId) !== claim!.price)
      return "Hanya bisa ganti ke tema dengan harga yang sama.";
  }
  return null;
}

/** Versi untuk aksi yang hanya punya id undangan (upload, ucapan, dll.). */
export async function customerEditErrorById(
  role: UserRole,
  invitationId: string,
  now = new Date(),
): Promise<string | null> {
  if (role !== "CUSTOMER") return null;
  const inv = await db.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, themeId: true, activeUntil: true },
  });
  if (!inv) return "Undangan tidak ditemukan.";
  return customerEditError(role, inv, undefined, now);
}
