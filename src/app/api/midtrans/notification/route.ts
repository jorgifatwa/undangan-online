import { outcomeOf, verifySignature, type MidtransNotification } from "@/lib/midtrans";
import { applyPaymentOutcome } from "@/lib/web-orders/service";

/**
 * Webhook notifikasi Midtrans (HTTP notification URL di dashboard Midtrans):
 *   {APP_URL}/api/midtrans/notification
 * Keaslian dicek lewat signature_key (SHA-512 dengan server key). Nominal
 * dicocokkan dengan pesanan. Idempoten (notifikasi ganda aman).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const n = (await req.json().catch(() => null)) as MidtransNotification | null;
  if (!n?.order_id || !verifySignature(n))
    return Response.json({ error: "signature tidak valid" }, { status: 401 });
  // pesanan website saja (WEB-…); order_id lain diabaikan dengan 200
  if (!n.order_id.startsWith("WEB-")) return Response.json({ ok: true, ignored: true });

  const { db } = await import("@/lib/db");
  const order = await db.webOrder.findUnique({ where: { midtransOrderId: n.order_id } });
  if (!order) return Response.json({ ok: true, ignored: true });
  if (Math.round(Number(n.gross_amount)) !== order.amount) {
    console.error("[midtrans] nominal tidak cocok", n.order_id, n.gross_amount, order.amount);
    return Response.json({ error: "nominal tidak cocok" }, { status: 400 });
  }
  await applyPaymentOutcome(n.order_id, outcomeOf(n), n);
  return Response.json({ ok: true });
}
