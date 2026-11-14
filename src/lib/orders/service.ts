import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { applyOrderLines, buildOrderLines, PricingError, type OrderLine } from "@/lib/pricing";

/**
 * Pesanan PER UNDANGAN: tema / selisih upgrade tema / add-on (lib/pricing).
 * Siap Tahap 5 (Midtrans): createOrder → Snap → webhook memanggil
 * markOrderPaid + applyPaidOrder. Sebelum Midtrans ada, pesanan manual dibuat
 * lewat `pnpm admin:grant-theme` (tercatat di AdminAudit).
 */

export { PricingError };

async function loadInvitation(invitationId: string) {
  const inv = await db.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      userId: true,
      themeId: true,
      purchasedAt: true,
      themeCredit: true,
      ownedThemeIds: true,
    },
  });
  if (!inv) throw new PricingError("Undangan tidak ditemukan.");
  return inv;
}

/** Buat pesanan PENDING (harga disalin saat ini — perubahan harga nanti tidak berpengaruh). */
export async function createOrder(
  invitationId: string,
  opts: { themeId?: string; addons?: { addonId: string; qty: number }[] } = {},
  extra: { midtransOrderId?: string; status?: "PENDING" | "PAID"; paymentType?: string } = {},
) {
  const inv = await loadInvitation(invitationId);
  const lines: OrderLine[] = buildOrderLines(inv, opts);
  const amount = lines.reduce((n, l) => n + l.amount, 0);
  return db.order.create({
    data: {
      invitationId: inv.id,
      userId: inv.userId,
      amount,
      midtransOrderId: extra.midtransOrderId ?? `UO-${randomUUID()}`,
      status: extra.status ?? "PENDING",
      paymentType: extra.paymentType,
      paidAt: extra.status === "PAID" ? new Date() : null,
      items: { create: lines },
    },
    include: { items: true },
  });
}

/**
 * Terapkan pesanan LUNAS ke undangan: tema dibeli/diganti, kredit bertambah,
 * add-on tercatat (undangan siap diterbitkan). Idempoten — panggilan
 * ganda (mis. webhook terkirim dua kali) tidak menggandakan kredit.
 */
export async function applyPaidOrder(orderId: string) {
  return db.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new PricingError("Pesanan tidak ditemukan.");
      if (order.status !== "PAID") throw new PricingError("Pesanan belum lunas.");
      if (order.appliedAt) return { applied: false as const, order };
      const inv = await tx.invitation.findUniqueOrThrow({ where: { id: order.invitationId } });
      const next = applyOrderLines(inv, order.items);
      await tx.invitation.update({
        where: { id: inv.id },
        data: {
          themeId: next.themeId,
          purchasedAt: next.purchasedAt,
          themeCredit: next.themeCredit,
          ownedThemeIds: next.ownedThemeIds,
        },
      });
      for (const a of next.addons)
        await tx.invitationAddon.create({
          data: { invitationId: inv.id, addonId: a.addonId, quantity: a.quantity, orderId },
        });
      const done = await tx.order.update({
        where: { id: orderId },
        data: { appliedAt: new Date() },
      });
      return { applied: true as const, order: done };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Add-on yang dimiliki undangan (untuk getEntitlements). */
export async function invitationAddons(invitationId: string) {
  const rows = await db.invitationAddon.groupBy({
    by: ["addonId"],
    where: { invitationId },
    _sum: { quantity: true },
  });
  return rows.map((r) => ({ addonId: r.addonId, quantity: r._sum.quantity ?? 0 }));
}
