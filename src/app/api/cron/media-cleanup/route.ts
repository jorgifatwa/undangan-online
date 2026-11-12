import { cleanupMedia } from "@/lib/media/service";

/**
 * Pembersihan file upload (lihat cleanupMedia). Jadwalkan harian, mis. Vercel
 * Cron / cron server: `curl -H "Authorization: Bearer $CRON_SECRET" …`.
 * Bisa juga manual: pnpm media:cleanup.
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  return Response.json(await cleanupMedia());
}
