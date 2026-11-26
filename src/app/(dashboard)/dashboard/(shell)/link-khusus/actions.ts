"use server";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guard";
import { createClaim, hashClaimToken } from "@/lib/claims/service";
import { claimLinkMessage, claimUrl, loginMessage } from "@/lib/claims/messages";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { normalizeWaNumber } from "@/lib/invitations/share";
import { invitationUrl } from "@/lib/site";
import { getManifest } from "@/themes/registry";

/**
 * Aksi admin link khusus. Semua lewat requireAdmin (dicek ulang di server)
 * dan dicatat ke AdminAudit. Token mentah & kata sandi hanya dikembalikan
 * sekali ke layar admin — tidak pernah disimpan atau dicatat.
 */
type R<T> = ({ ok: true } & T) | { ok: false; error: string };

const PATH = "/dashboard/link-khusus";

async function audit(actor: string, action: string, invitationId: string | null, detail: object) {
  await db.adminAudit.create({ data: { actor, action, invitationId, detail } });
}

const createSchema = z.object({
  themeId: z.string().min(1, "Pilih tema"),
  customerName: z.string().trim().min(2, "Nama pembeli minimal 2 huruf").max(80),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.union([z.literal(""), z.email("Email tidak valid")]).optional(),
  marketplace: z.string().trim().max(40).optional(),
  marketplaceOrder: z.string().trim().max(80).optional(),
});

export interface IssuedLink {
  claimId: string;
  url: string;
  message: string;
  phone: string | null;
  email: string | null;
}

export async function createClaimAction(raw: unknown): Promise<R<{ link: IssuedLink }>> {
  const admin = await requireAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const manifest = getManifest(v.themeId);
  if (!manifest) return { ok: false, error: "Tema tidak dikenal." };
  const phone = v.customerPhone ? normalizeWaNumber(v.customerPhone) : null;
  if (v.customerPhone && !phone) return { ok: false, error: "Nomor WhatsApp tidak valid." };

  const { claim, token } = await createClaim({
    source: "MARKETPLACE",
    themeId: v.themeId,
    customerName: v.customerName,
    customerPhone: phone,
    customerEmail: v.customerEmail || null,
    marketplace: v.marketplace || null,
    marketplaceOrder: v.marketplaceOrder || null,
    createdById: admin.id,
  });
  await audit(admin.email ?? admin.id, "claim.create", claim.invitationId, {
    code: claim.code,
    themeId: v.themeId,
    marketplace: v.marketplace ?? null,
    order: v.marketplaceOrder ?? null,
  });
  revalidatePath(PATH);
  const url = claimUrl(token);
  return {
    ok: true,
    link: {
      claimId: claim.id,
      url,
      phone,
      email: claim.customerEmail,
      message: claimLinkMessage({
        customerName: claim.customerName,
        themeName: manifest.name,
        url,
        expiresAt: claim.expiresAt,
      }),
    },
  };
}

/** Buat link baru untuk claim yang sama (link lama langsung mati). */
export async function rotateClaimAction(claimId: string): Promise<R<{ link: IssuedLink }>> {
  const admin = await requireAdmin();
  const claim = await db.claimLink.findUnique({
    where: { id: claimId },
    include: { invitation: { select: { themeId: true } } },
  });
  if (!claim) return { ok: false, error: "Link tidak ditemukan." };
  if (claim.status === "REVOKED") return { ok: false, error: "Link sudah dicabut." };
  const token = randomBytes(32).toString("base64url");
  await db.claimLink.update({
    where: { id: claim.id },
    data: { tokenHash: hashClaimToken(token) },
  });
  await audit(admin.email ?? admin.id, "claim.rotate", claim.invitationId, { code: claim.code });
  const url = claimUrl(token);
  return {
    ok: true,
    link: {
      claimId: claim.id,
      url,
      phone: claim.customerPhone,
      email: claim.customerEmail,
      message: claimLinkMessage({
        customerName: claim.customerName,
        themeName: getManifest(claim.invitation.themeId)?.name ?? claim.invitation.themeId,
        url,
        expiresAt: claim.expiresAt,
      }),
    },
  };
}

/** Cabut link yang belum dikonfirmasi (data dihapus otomatis saat batas waktu lewat). */
export async function revokeClaimAction(claimId: string): Promise<R<object>> {
  const admin = await requireAdmin();
  const r = await db.claimLink.updateMany({
    where: { id: claimId, status: "OPEN" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  if (r.count === 0)
    return { ok: false, error: "Hanya link yang belum dikonfirmasi yang bisa dicabut." };
  await audit(admin.email ?? admin.id, "claim.revoke", null, { claimId });
  revalidatePath(PATH);
  return { ok: true };
}

/** Perpanjang batas waktu link yang belum dikonfirmasi. */
export async function extendClaimAction(claimId: string, days: number): Promise<R<object>> {
  const admin = await requireAdmin();
  const d = z.number().int().min(1).max(365).safeParse(days);
  if (!d.success) return { ok: false, error: "1–365 hari." };
  const claim = await db.claimLink.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "OPEN")
    return { ok: false, error: "Link tidak bisa diperpanjang." };
  const base = Math.max(Date.now(), claim.expiresAt.getTime());
  await db.claimLink.update({
    where: { id: claim.id },
    data: { expiresAt: new Date(base + d.data * 86400_000) },
  });
  await audit(admin.email ?? admin.id, "claim.extend", claim.invitationId, { days: d.data });
  revalidatePath(PATH);
  return { ok: true };
}

/** Perpanjang masa aktif undangan yang sudah tayang. */
export async function extendActiveAction(claimId: string, days: number): Promise<R<object>> {
  const admin = await requireAdmin();
  const d = z.number().int().min(1).max(3650).safeParse(days);
  if (!d.success) return { ok: false, error: "1–3650 hari." };
  const claim = await db.claimLink.findUnique({
    where: { id: claimId },
    include: { invitation: { select: { id: true, activeUntil: true } } },
  });
  if (!claim || claim.status !== "CONFIRMED") return { ok: false, error: "Undangan belum tayang." };
  const base = Math.max(Date.now(), claim.invitation.activeUntil?.getTime() ?? 0);
  await db.invitation.update({
    where: { id: claim.invitation.id },
    data: { activeUntil: new Date(base + d.data * 86400_000) },
  });
  await audit(admin.email ?? admin.id, "claim.extendActive", claim.invitationId, { days: d.data });
  revalidatePath(PATH);
  return { ok: true };
}

/** Kata sandi acak yang mudah diketik (tanpa huruf/angka mirip). */
function newPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return [...randomBytes(12)].map((b) => chars[b % chars.length]).join("");
}

export interface IssuedLogin {
  email: string;
  password: string;
  message: string;
  phone: string | null;
}

/**
 * Buat / atur ulang data login akun pembeli (email + kata sandi acak).
 * Hanya untuk undangan yang sudah tayang.
 */
export async function issueLoginAction(
  claimId: string,
  rawEmail: string,
): Promise<R<{ login: IssuedLogin }>> {
  const admin = await requireAdmin();
  const e = z.email("Email tidak valid").safeParse(
    String(rawEmail ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!e.success) return { ok: false, error: e.error.issues[0].message };
  const email = e.data;
  const claim = await db.claimLink.findUnique({
    where: { id: claimId },
    include: { invitation: { select: { id: true, slug: true, userId: true } } },
  });
  if (!claim || claim.status !== "CONFIRMED")
    return { ok: false, error: "Akun dibuat setelah undangan dikonfirmasi pembeli." };
  const owner = await db.user.findUnique({ where: { id: claim.invitation.userId } });
  if (!owner || owner.role !== "CUSTOMER")
    return { ok: false, error: "Pemilik undangan bukan akun pembeli." };

  const password = newPassword();
  try {
    await db.user.update({
      where: { id: owner.id },
      data: { email, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
      return { ok: false, error: "Email ini sudah dipakai akun lain." };
    throw err;
  }
  await db.claimLink.update({ where: { id: claim.id }, data: { customerEmail: email } });
  await audit(admin.email ?? admin.id, "claim.login", claim.invitationId, { email });
  revalidatePath(PATH);
  return {
    ok: true,
    login: {
      email,
      password,
      phone: claim.customerPhone,
      message: loginMessage({
        customerName: claim.customerName,
        email,
        password,
        invitationUrl: invitationUrl(claim.invitation.slug),
      }),
    },
  };
}

/** Kirim pesan (link khusus / data login) ke email pembeli lewat SMTP. */
export async function emailCustomerAction(
  to: string,
  kind: "link" | "login",
  message: string,
): Promise<R<object>> {
  await requireAdmin();
  if (!emailConfigured()) return { ok: false, error: "SMTP belum diisi di env." };
  const e = z.email().safeParse(to);
  if (!e.success) return { ok: false, error: "Email tidak valid." };
  const r = await sendEmail({
    to: e.data,
    subject: kind === "link" ? "Link pengisian undangan Anda" : "Data login undangan Anda",
    text: message.replace(/\*/g, ""),
  });
  return r.ok ? { ok: true } : r;
}
