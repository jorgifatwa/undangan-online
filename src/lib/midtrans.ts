import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * MIDTRANS SNAP (pembayaran pesanan website). Kunci diisi pemilik di env:
 *   MIDTRANS_SERVER_KEY, MIDTRANS_IS_PRODUCTION ("true" = production, selain itu sandbox).
 * Pembeli diarahkan ke halaman pembayaran Snap (redirect_url) — tanpa skrip
 * klien, jadi client key tidak diperlukan.
 * Notifikasi (webhook) diverifikasi dengan signature_key SHA-512.
 * Set URL notifikasi di dashboard Midtrans: {APP_URL}/api/midtrans/notification
 */
export function midtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

const production = () => process.env.MIDTRANS_IS_PRODUCTION === "true";
const snapBase = () =>
  production() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
const apiBase = () =>
  production() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
const authHeader = () =>
  `Basic ${Buffer.from(`${process.env.MIDTRANS_SERVER_KEY ?? ""}:`).toString("base64")}`;

export class MidtransError extends Error {}

export interface SnapRequest {
  orderId: string;
  amount: number;
  items: { id: string; name: string; price: number; quantity: number }[];
  customer: { name: string; email: string; phone?: string | null };
  finishUrl: string;
}

/** Buat transaksi Snap → { token, redirectUrl }. */
export async function createSnapTransaction(req: SnapRequest) {
  if (!midtransConfigured()) throw new MidtransError("Midtrans belum dikonfigurasi.");
  const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      transaction_details: { order_id: req.orderId, gross_amount: req.amount },
      item_details: req.items.map((i) => ({ ...i, name: i.name.slice(0, 50) })),
      customer_details: {
        first_name: req.customer.name.slice(0, 50),
        email: req.customer.email,
        ...(req.customer.phone ? { phone: req.customer.phone } : {}),
      },
      callbacks: { finish: req.finishUrl },
      expiry: { unit: "hours", duration: 24 },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const body = (await res.json().catch(() => null)) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  } | null;
  if (!res.ok || !body?.token || !body.redirect_url) {
    console.error("[midtrans] snap gagal", res.status, body?.error_messages);
    throw new MidtransError("Gagal membuat pembayaran. Coba lagi sebentar lagi.");
  }
  return { token: body.token, redirectUrl: body.redirect_url };
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

/** signature_key = SHA512(order_id + status_code + gross_amount + server_key). */
export function verifySignature(
  n: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount" | "signature_key">,
) {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || typeof n.signature_key !== "string") return false;
  const expected = createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(n.signature_key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Cek status transaksi langsung ke Midtrans (halaman hasil / cadangan webhook). */
export async function fetchTransactionStatus(orderId: string) {
  if (!midtransConfigured()) return null;
  const res = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as MidtransNotification | null;
}

export type PaymentOutcome = "paid" | "pending" | "failed" | "expired";

/** Petakan status Midtrans → hasil pesanan. */
export function outcomeOf(
  n: Pick<MidtransNotification, "transaction_status" | "fraud_status">,
): PaymentOutcome {
  const s = n.transaction_status;
  if (s === "settlement") return "paid";
  if (s === "capture") return n.fraud_status === "accept" || !n.fraud_status ? "paid" : "pending";
  if (s === "expire") return "expired";
  if (s === "cancel" || s === "deny" || s === "failure") return "failed";
  return "pending";
}
