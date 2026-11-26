import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { claimLinkMessage, claimUrl } from "@/lib/claims/messages";
import { createClaim } from "@/lib/claims/service";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { normalizeWaNumber } from "@/lib/invitations/share";
import {
  createSnapTransaction,
  fetchTransactionStatus,
  midtransConfigured,
  outcomeOf,
  type MidtransNotification,
  type PaymentOutcome,
} from "@/lib/midtrans";
import { themePrice } from "@/lib/pricing";
import { siteConfig } from "@/lib/site";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";

import { open, seal } from "./secret-box";

/**
 * PESANAN WEBSITE: isian form dari browser → pesanan PENDING → bayar (Midtrans)
 * → LUNAS → undangan draf + link khusus (source WEBSITE) berisi isian tadi →
 * link dikirim via email & tampil di halaman hasil → selanjutnya sama dengan
 * alur marketplace (/isi/{token}).
 */
export class WebOrderError extends Error {}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newOrderId = () =>
  `WEB-${[...randomBytes(8)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("")}`;
const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");

/** Simulasi bayar tanpa Midtrans hanya di development. */
export const simulationAllowed = () =>
  process.env.NODE_ENV !== "production" && !midtransConfigured();

export interface CreateWebOrderInput {
  themeId: string;
  colorVariant: string | null;
  eventType: "WEDDING" | "BIRTHDAY";
  data: unknown;
  buyerName: string;
  buyerPhone?: string | null;
  buyerEmail: string;
}

/** Buat pesanan + transaksi Midtrans. viewKey hanya dikembalikan sekali (disimpan browser). */
export async function createWebOrder(input: CreateWebOrderInput) {
  const manifest = getManifest(input.themeId);
  const price = themePrice(input.themeId);
  if (!manifest || price === null || !manifest.eventTypes.includes(input.eventType))
    throw new WebOrderError("Tema tidak tersedia.");
  const variant =
    manifest.variants.find((v) => v.id === input.colorVariant)?.id ??
    manifest.variants[0]?.id ??
    null;
  const parsed = parseInvitationData(input.eventType, input.data, { strict: true });
  if (!parsed.ok) throw new WebOrderError("Ada isian undangan yang belum valid.");
  const phone = input.buyerPhone?.trim() ? normalizeWaNumber(input.buyerPhone) : null;
  if (input.buyerPhone?.trim() && !phone) throw new WebOrderError("Nomor WhatsApp tidak valid.");
  // pembatas spam: maks. 5 pesanan belum dibayar per email per jam
  const recent = await db.webOrder.count({
    where: {
      buyerEmail: input.buyerEmail,
      status: "PENDING",
      createdAt: { gte: new Date(Date.now() - 3600_000) },
    },
  });
  if (recent >= 5)
    throw new WebOrderError("Terlalu banyak pesanan belum dibayar. Coba lagi dalam 1 jam.");
  if (!midtransConfigured() && !simulationAllowed())
    throw new WebOrderError("Pembayaran online belum aktif. Silakan hubungi kami lewat WhatsApp.");

  const viewKey = randomBytes(24).toString("base64url");
  const order = await db.webOrder.create({
    data: {
      midtransOrderId: newOrderId(),
      themeId: manifest.id,
      colorVariant: variant,
      eventType: input.eventType,
      data: parsed.value.data as unknown as Prisma.InputJsonValue,
      buyerName: input.buyerName,
      buyerPhone: phone,
      buyerEmail: input.buyerEmail,
      amount: price,
      viewKeyHash: hashKey(viewKey),
    },
  });
  const finishUrl = `${siteConfig.appUrl}/pesan/selesai?order_id=${order.midtransOrderId}`;
  if (!midtransConfigured()) return { order, viewKey, redirectUrl: finishUrl };

  const snap = await createSnapTransaction({
    orderId: order.midtransOrderId,
    amount: price,
    items: [{ id: manifest.id, name: `Undangan tema ${manifest.name}`, price, quantity: 1 }],
    customer: { name: input.buyerName, email: input.buyerEmail, phone },
    finishUrl,
  });
  await db.webOrder.update({
    where: { id: order.id },
    data: { snapToken: snap.token, redirectUrl: snap.redirectUrl },
  });
  return { order, viewKey, redirectUrl: snap.redirectUrl };
}

/**
 * Terapkan hasil pembayaran (webhook / cek status / simulasi). Idempoten:
 * notifikasi ganda tidak membuat link ganda.
 */
export async function applyPaymentOutcome(
  midtransOrderId: string,
  outcome: PaymentOutcome,
  raw?: MidtransNotification | null,
) {
  const order = await db.webOrder.findUnique({ where: { midtransOrderId } });
  if (!order) return null;
  if (outcome === "paid") {
    if (order.status !== "PAID")
      await db.webOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentType: raw?.payment_type ?? order.paymentType,
          rawNotification: (raw ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    await fulfil(order.id);
  } else if (outcome !== "pending" && order.status === "PENDING") {
    await db.webOrder.update({
      where: { id: order.id },
      data: {
        status: outcome === "expired" ? "EXPIRED" : "FAILED",
        rawNotification: (raw ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
  return db.webOrder.findUnique({ where: { id: order.id } });
}

/** Lunas → undangan draf + link khusus berisi isian pesanan, lalu kirim email. */
async function fulfil(orderId: string) {
  // kunci: hanya satu proses yang memenuhi pesanan
  const lock = await db.webOrder.updateMany({
    where: { id: orderId, status: "PAID", fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  if (lock.count === 0) return;
  const order = await db.webOrder.findUniqueOrThrow({ where: { id: orderId } });
  try {
    const { claim, token } = await createClaim({
      source: "WEBSITE",
      themeId: order.themeId,
      customerName: order.buyerName,
      customerPhone: order.buyerPhone,
      customerEmail: order.buyerEmail,
    });
    await db.$transaction([
      db.invitation.update({
        where: { id: claim.invitationId },
        data: { data: order.data as Prisma.InputJsonValue, colorVariant: order.colorVariant },
      }),
      // isian sudah lengkap → link dibuka langsung di langkah Konfirmasi
      db.claimLink.update({ where: { id: claim.id }, data: { step: 99 } }),
      db.webOrder.update({
        where: { id: order.id },
        // isian sudah pindah ke undangan → salinan di pesanan dikosongkan
        data: { claimId: claim.id, claimTokenEnc: seal(token), data: {} },
      }),
    ]);
    if (emailConfigured()) {
      const r = await sendEmail({
        to: order.buyerEmail,
        subject: "Pembayaran diterima — link pengisian undangan Anda",
        text: claimLinkMessage({
          customerName: order.buyerName,
          themeName: getManifest(order.themeId)?.name ?? order.themeId,
          url: claimUrl(token),
          expiresAt: claim.expiresAt,
        }).replace(/\*/g, ""),
      });
      if (r.ok)
        await db.webOrder.update({ where: { id: order.id }, data: { emailSentAt: new Date() } });
    }
  } catch (e) {
    console.error("[web-order] gagal memenuhi pesanan", order.midtransOrderId, e);
    const fresh = await db.webOrder.findUnique({ where: { id: order.id } });
    // belum sempat membuat link → buka kunci agar dicoba lagi (webhook berikutnya / halaman hasil)
    if (!fresh?.claimId)
      await db.webOrder.update({ where: { id: order.id }, data: { fulfilledAt: null } });
  }
}

export interface WebOrderView {
  orderId: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  amount: number;
  themeName: string;
  buyerEmail: string;
  claimUrl: string | null;
  emailSent: boolean;
  canSimulate: boolean;
}

/**
 * Halaman hasil: hanya pemegang viewKey (browser pemesan). Pesanan yang masih
 * PENDING dicek langsung ke Midtrans (webhook bisa terlambat / tidak sampai ke localhost).
 */
export async function getWebOrderView(
  midtransOrderId: string,
  viewKey: string,
): Promise<WebOrderView | null> {
  let order = await db.webOrder.findUnique({ where: { midtransOrderId: String(midtransOrderId) } });
  if (!order || typeof viewKey !== "string") return null;
  const a = Buffer.from(order.viewKeyHash);
  const b = Buffer.from(hashKey(viewKey));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (order.status === "PENDING" && midtransConfigured()) {
    const st = await fetchTransactionStatus(order.midtransOrderId).catch(() => null);
    if (st && st.order_id === order.midtransOrderId)
      order = (await applyPaymentOutcome(order.midtransOrderId, outcomeOf(st), st)) ?? order;
  }
  // lunas tapi pemenuhan sempat gagal → coba lagi
  if (order.status === "PAID" && !order.claimId) {
    await fulfil(order.id);
    order = (await db.webOrder.findUnique({ where: { id: order.id } })) ?? order;
  }
  const token = order.claimTokenEnc ? open(order.claimTokenEnc) : null;
  return {
    orderId: order.midtransOrderId,
    status: order.status,
    amount: order.amount,
    themeName: getManifest(order.themeId)?.name ?? order.themeId,
    buyerEmail: order.buyerEmail,
    claimUrl: token ? claimUrl(token) : null,
    emailSent: !!order.emailSentAt,
    canSimulate: order.status === "PENDING" && simulationAllowed(),
  };
}

/** Pesanan tidak dibayar > 2 hari dihapus (beserta isian form-nya). */
export async function purgeUnpaidWebOrders(now = new Date()) {
  const r = await db.webOrder.deleteMany({
    where: {
      status: { in: ["PENDING", "FAILED", "EXPIRED"] },
      createdAt: { lte: new Date(now.getTime() - 2 * 86400_000) },
    },
  });
  return { deleted: r.count };
}

// ------------------------------- Admin -------------------------------------

/**
 * Admin: perbarui pesanan — PENDING dicek ke Midtrans; LUNAS tapi link belum
 * dibuat → dipenuhi ulang. Mengembalikan pesanan terbaru.
 */
export async function adminRefreshOrder(id: string) {
  const order = await db.webOrder.findUnique({ where: { id } });
  if (!order) return null;
  if (order.status === "PENDING" && midtransConfigured()) {
    const st = await fetchTransactionStatus(order.midtransOrderId).catch(() => null);
    if (st && st.order_id === order.midtransOrderId)
      await applyPaymentOutcome(order.midtransOrderId, outcomeOf(st), st);
  }
  const now = await db.webOrder.findUnique({ where: { id } });
  if (now?.status === "PAID" && !now.claimId) await fulfil(id);
  return db.webOrder.findUnique({ where: { id } });
}

/** Link khusus pesanan (dibuka dari token terenkripsi), atau null. */
export function orderClaimUrl(order: { claimTokenEnc: string | null }) {
  const token = order.claimTokenEnc ? open(order.claimTokenEnc) : null;
  return token ? claimUrl(token) : null;
}

/** Admin: kirim ulang email link khusus ke pemesan. */
export async function resendOrderEmail(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!emailConfigured()) return { ok: false, error: "SMTP belum diisi di env." };
  const order = await db.webOrder.findUnique({ where: { id } });
  const url = order ? orderClaimUrl(order) : null;
  if (!order || !url || !order.claimId)
    return { ok: false, error: "Link khusus pesanan belum ada." };
  const claim = await db.claimLink.findUnique({ where: { id: order.claimId } });
  if (!claim) return { ok: false, error: "Link khusus tidak ditemukan." };
  const r = await sendEmail({
    to: order.buyerEmail,
    subject: "Link pengisian undangan Anda",
    text: claimLinkMessage({
      customerName: order.buyerName,
      themeName: getManifest(order.themeId)?.name ?? order.themeId,
      url,
      expiresAt: claim.expiresAt,
    }).replace(/\*/g, ""),
  });
  if (!r.ok) return r;
  await db.webOrder.update({ where: { id }, data: { emailSentAt: new Date() } });
  return { ok: true };
}
