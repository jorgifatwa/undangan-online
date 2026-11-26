import { purgeExpiredClaims } from "@/lib/claims/service";

/**
 * Hapus link khusus yang lewat batas waktu (pengaturan super admin) & belum
 * dikonfirmasi, beserta undangan drafnya. Jadwalkan harian:
 * `curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/claims-cleanup`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  return Response.json(await purgeExpiredClaims());
}
