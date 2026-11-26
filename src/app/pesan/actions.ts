"use server";

import { z } from "zod";

import { MidtransError } from "@/lib/midtrans";
import {
  applyPaymentOutcome,
  createWebOrder,
  getWebOrderView,
  simulationAllowed,
  WebOrderError,
  type WebOrderView,
} from "@/lib/web-orders/service";

/** Aksi publik pemesanan website (tanpa login). Semua isian divalidasi ulang di server. */
type R<T> = ({ ok: true } & T) | { ok: false; error: string };

const buyerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
  email: z.email("Email tidak valid").transform((v) => v.trim().toLowerCase()),
  phone: z.string().trim().max(30).optional(),
});

export async function createWebOrderAction(input: {
  themeId: string;
  colorVariant: string | null;
  eventType: "WEDDING" | "BIRTHDAY";
  data: unknown;
  buyer: { name: string; email: string; phone?: string };
}): Promise<R<{ orderId: string; viewKey: string; redirectUrl: string }>> {
  const buyer = buyerSchema.safeParse(input?.buyer);
  if (!buyer.success) return { ok: false, error: buyer.error.issues[0].message };
  if (input.eventType !== "WEDDING" && input.eventType !== "BIRTHDAY")
    return { ok: false, error: "Jenis acara tidak valid." };
  try {
    const r = await createWebOrder({
      themeId: String(input.themeId),
      colorVariant: input.colorVariant ? String(input.colorVariant) : null,
      eventType: input.eventType,
      data: input.data,
      buyerName: buyer.data.name,
      buyerEmail: buyer.data.email,
      buyerPhone: buyer.data.phone || null,
    });
    return {
      ok: true,
      orderId: r.order.midtransOrderId,
      viewKey: r.viewKey,
      redirectUrl: r.redirectUrl,
    };
  } catch (e) {
    if (e instanceof WebOrderError || e instanceof MidtransError)
      return { ok: false, error: e.message };
    console.error("[pesan]", e);
    return { ok: false, error: "Terjadi kesalahan. Coba lagi." };
  }
}

export async function webOrderViewAction(
  orderId: string,
  viewKey: string,
): Promise<R<{ order: WebOrderView }>> {
  const order = await getWebOrderView(String(orderId).slice(0, 40), String(viewKey).slice(0, 100));
  return order ? { ok: true, order } : { ok: false, error: "Pesanan tidak ditemukan." };
}

/** DEVELOPMENT tanpa Midtrans: tandai lunas untuk menguji alur. */
export async function simulatePayAction(
  orderId: string,
  viewKey: string,
): Promise<R<{ order: WebOrderView }>> {
  if (!simulationAllowed()) return { ok: false, error: "Simulasi tidak tersedia." };
  const view = await getWebOrderView(String(orderId).slice(0, 40), String(viewKey).slice(0, 100));
  if (!view) return { ok: false, error: "Pesanan tidak ditemukan." };
  await applyPaymentOutcome(view.orderId, "paid");
  const fresh = await getWebOrderView(view.orderId, viewKey);
  return fresh ? { ok: true, order: fresh } : { ok: false, error: "Pesanan tidak ditemukan." };
}
