import { clientIp, hashIp } from "@/lib/guestbook/ip";
import { submitGuestbook } from "@/lib/guestbook/service";

/** Kirim RSVP / ucapan dari halaman undangan publik (lihat lib/guestbook/service.ts). */
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 8_000) return Response.json({ error: "Kiriman terlalu besar." }, { status: 413 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Format kiriman tidak valid." }, { status: 400 });
  }
  const res = await submitGuestbook(slug, body, hashIp(clientIp(req.headers)));
  if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
  return Response.json(
    { wish: res.wish ?? null, stats: res.stats },
    { headers: { "Cache-Control": "no-store" } },
  );
}
