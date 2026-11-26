import { markCronRun } from "@/lib/admin/cron-log";
import { purgeExpiredClaims } from "@/lib/claims/service";
import { purgeUnpaidWebOrders } from "@/lib/web-orders/service";

/**
 * Hapus link khusus yang lewat batas waktu (pengaturan super admin) & belum
 * dikonfirmasi, beserta undangan drafnya, serta pesanan website yang tidak
 * dibayar > 2 hari (beserta isian form-nya). Jadwalkan harian:
 * `curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/claims-cleanup`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  const [claims, webOrders] = await Promise.all([purgeExpiredClaims(), purgeUnpaidWebOrders()]);
  await markCronRun("claims-cleanup", { claims, webOrders });
  return Response.json({ claims, webOrders });
}
