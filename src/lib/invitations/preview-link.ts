import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "@/lib/db";

import { PREVIEW_LINK_DAYS } from "./preview-link-config";

export { PREVIEW_LINK_DAYS };

/**
 * LINK PRATINJAU RAHASIA: /p/{token}
 *  - token acak 32 byte (base64url); yang disimpan hanya hash SHA-256-nya,
 *    jadi kebocoran database tidak membocorkan link yang bisa dibuka.
 *  - satu link aktif per undangan: membuat link baru mencabut yang lama.
 *  - kedaluwarsa 7 hari, bisa dicabut kapan saja; undangan DITANGGUHKAN → 404.
 *  - selalu menampilkan data draf TERBARU (bukan salinan).
 */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const hashPreviewToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Buat link baru (mencabut link aktif sebelumnya). Token mentah hanya dikembalikan sekali. */
export async function createPreviewLink(invitationId: string, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + PREVIEW_LINK_DAYS * 86400_000);
  await db.$transaction([
    db.previewLink.updateMany({
      where: { invitationId, revokedAt: null },
      data: { revokedAt: now },
    }),
    db.previewLink.create({
      data: { invitationId, tokenHash: hashPreviewToken(token), expiresAt },
    }),
  ]);
  return { token, expiresAt };
}

export async function revokePreviewLinks(invitationId: string, now = new Date()) {
  const r = await db.previewLink.updateMany({
    where: { invitationId, revokedAt: null },
    data: { revokedAt: now },
  });
  return r.count;
}

/** Link yang masih berlaku (untuk ditampilkan di editor — tanpa token). */
export async function activePreviewLink(invitationId: string, now = new Date()) {
  return db.previewLink.findFirst({
    where: { invitationId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, expiresAt: true, createdAt: true },
  });
}

/** Undangan untuk /p/{token}; null = token salah/kedaluwarsa/dicabut atau undangan ditangguhkan. */
export async function resolvePreviewToken(token: string, now = new Date()) {
  if (!TOKEN_RE.test(token)) return null;
  const link = await db.previewLink.findUnique({
    where: { tokenHash: hashPreviewToken(token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      invitation: {
        select: {
          id: true,
          slug: true,
          themeId: true,
          colorVariant: true,
          eventType: true,
          data: true,
          suspendedAt: true,
        },
      },
    },
  });
  if (!link || link.revokedAt || link.expiresAt <= now) return null;
  if (link.invitation.suspendedAt) return null;
  return { ...link.invitation, linkExpiresAt: link.expiresAt };
}
