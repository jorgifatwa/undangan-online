import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  deviceFromCookieHeader,
  newDeviceId,
} from "@/lib/guestbook/device";
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
  const deviceId = deviceFromCookieHeader(req.headers.get("cookie"));
  const res = await submitGuestbook(slug, body, {
    ipHash: hashIp(clientIp(req.headers)),
    deviceId,
  });
  const headers = new Headers({ "Cache-Control": "no-store" });
  // Cookie hilang/diblokir: beri penanda baru untuk kiriman berikutnya.
  if (!deviceId) {
    const o = deviceCookieOptions(new URL(req.url).protocol === "https:");
    headers.append(
      "Set-Cookie",
      `${DEVICE_COOKIE}=${newDeviceId()}; Path=${o.path}; Max-Age=${o.maxAge}; HttpOnly; SameSite=Lax${o.secure ? "; Secure" : ""}`,
    );
  }
  if (!res.ok)
    return Response.json(
      { error: res.error, ...(res.rateLimited ? { rateLimited: true } : {}) },
      { status: res.status, headers },
    );
  return Response.json({ wish: res.wish ?? null, stats: res.stats }, { headers });
}
