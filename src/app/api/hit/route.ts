import { isVisitKey } from "@/lib/analytics/keys";
import { recordVisit } from "@/lib/analytics/visits";

/**
 * POST /api/hit — penghitung pengunjung ramah privasi. Body: kunci peristiwa
 * (teks). Tidak membaca/menyimpan cookie, IP, atau identitas apa pun; bot &
 * browser otomatis diabaikan. Selalu 204 (tidak membocorkan apa pun).
 */
export const runtime = "nodejs";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  const key = (await req.text().catch(() => "")).trim().slice(0, 40);
  if (isVisitKey(key)) await recordVisit(key).catch(() => undefined);
  return new Response(null, { status: 204 });
}
