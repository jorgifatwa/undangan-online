import { markCronRun } from "@/lib/admin/cron-log";
import { sendDailyReport } from "@/lib/admin/notify";

/**
 * Email ringkasan harian ke admin (kemarin, WIB). Jadwal: 00.00 UTC = 07.00 WIB.
 * `curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/daily-report`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  const r = await sendDailyReport();
  await markCronRun("daily-report", r);
  return Response.json(r);
}
