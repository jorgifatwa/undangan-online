import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { buildInitialData, wizardSchema } from "@/lib/invitations/initial-data";
import { themePrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { getManifest } from "@/themes/registry";

/**
 * LINK KHUSUS: /isi/{token}
 *  - Pembeli mengisi undangannya sendiri (form bertahap + pratinjau) tanpa login.
 *  - Token acak 32 byte (base64url); yang disimpan hanya hash SHA-256-nya.
 *  - Satu link per undangan draf; draf dibuat bersamaan dengan link.
 *  - Kedaluwarsa sesuai pengaturan global `claimLinkDays`; lewat & belum
 *    dikonfirmasi → undangan draf + link dihapus otomatis (purgeExpiredClaims).
 *  - Setelah dikonfirmasi (CONFIRMED) undangan tayang & tema terkunci; link
 *    tetap bisa dibuka (hanya-baca) sampai masa aktif undangan habis.
 */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const hashClaimToken = (token: string) => createHash("sha256").update(token).digest("hex");

function newCode() {
  const b = randomBytes(4);
  return `LK-${[...b].map((x) => CODE_CHARS[x % CODE_CHARS.length]).join("")}`;
}

/** Tanggal acara bawaan draf: 60 hari dari sekarang (yyyy-mm-dd). */
function defaultDate(now: Date) {
  return new Date(now.getTime() + 60 * 86400_000).toISOString().slice(0, 10);
}

export interface CreateClaimInput {
  source: "MARKETPLACE" | "WEBSITE";
  themeId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  marketplace?: string | null;
  marketplaceOrder?: string | null;
  /** Pemilik draf sementara (admin pembuat); dipindah ke akun pembeli nanti. */
  ownerUserId: string;
  createdById?: string | null;
}

/** Buat undangan draf + link khusus. Token mentah hanya dikembalikan sekali. */
export async function createClaim(input: CreateClaimInput, now = new Date()) {
  const manifest = getManifest(input.themeId);
  const price = themePrice(input.themeId);
  if (!manifest || price === null) throw new Error("Tema tidak dikenal");
  const eventType = manifest.eventTypes[0];
  const { claimLinkDays } = await getSettings();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + claimLinkDays * 86400_000);
  const initial = buildInitialData(
    wizardSchema.parse(
      eventType === "WEDDING"
        ? {
            eventType: "WEDDING",
            brideName: "Mempelai Wanita",
            groomName: "Mempelai Pria",
            date: defaultDate(now),
            timezone: "WIB",
            city: "Kota",
            greeting: "islami",
            themeId: input.themeId,
          }
        : {
            eventType: "BIRTHDAY",
            name: input.customerName,
            date: defaultDate(now),
            timezone: "WIB",
            city: "Kota",
            themeId: input.themeId,
          },
    ),
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      const claim = await db.$transaction(async (tx) => {
        const invitation = await tx.invitation.create({
          data: {
            userId: input.ownerUserId,
            // alamat sementara (draf tidak tayang); pembeli memilih alamatnya sendiri
            slug: `draf-${code.toLowerCase()}`,
            eventType,
            themeId: input.themeId,
            colorVariant: manifest.variants[0]?.id ?? null,
            data: initial.data as object,
            // dibayar di luar sistem (marketplace) / lewat pembayaran website
            purchasedAt: now,
            themeCredit: price,
            ownedThemeIds: [input.themeId],
          },
        });
        return tx.claimLink.create({
          data: {
            code,
            tokenHash: hashClaimToken(token),
            source: input.source,
            marketplace: input.marketplace ?? null,
            marketplaceOrder: input.marketplaceOrder ?? null,
            customerName: input.customerName,
            customerPhone: input.customerPhone ?? null,
            customerEmail: input.customerEmail ?? null,
            price,
            invitationId: invitation.id,
            expiresAt,
            createdById: input.createdById ?? null,
          },
        });
      });
      return { claim, token };
    } catch (e) {
      // tabrakan kode/slug (sangat jarang) → coba kode lain
      if (attempt === 4) throw e;
    }
  }
  throw new Error("Gagal membuat link khusus");
}

export type ClaimState = "open" | "confirmed" | "expired" | "revoked" | "not-found";

/** Cari link khusus dari token mentah; status dihitung (kedaluwarsa dsb.). */
export async function findClaimByToken(token: string, now = new Date()) {
  if (!TOKEN_RE.test(token)) return { state: "not-found" as const, claim: null };
  const claim = await db.claimLink.findUnique({
    where: { tokenHash: hashClaimToken(token) },
    include: { invitation: true },
  });
  if (!claim) return { state: "not-found" as const, claim: null };
  const state: ClaimState =
    claim.status === "REVOKED"
      ? "revoked"
      : claim.status === "CONFIRMED"
        ? "confirmed"
        : claim.expiresAt <= now
          ? "expired"
          : "open";
  return { state, claim };
}

/**
 * Hapus link khusus yang kedaluwarsa & belum dikonfirmasi beserta undangan
 * drafnya (link ikut terhapus lewat cascade). Media undangan dilepas
 * (invitationId → null) lalu dibersihkan oleh job media-cleanup.
 */
export async function purgeExpiredClaims(now = new Date()) {
  const expired = await db.claimLink.findMany({
    where: { status: { in: ["OPEN", "REVOKED"] }, expiresAt: { lte: now } },
    select: { invitationId: true },
    take: 500,
  });
  if (expired.length === 0) return { deleted: 0 };
  const r = await db.invitation.deleteMany({
    where: { id: { in: expired.map((e) => e.invitationId) }, status: "DRAFT" },
  });
  return { deleted: r.count };
}
