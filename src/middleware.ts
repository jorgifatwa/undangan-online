import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  newDeviceId,
  parseDeviceId,
} from "@/lib/guestbook/device";
import { slugFromHost } from "@/lib/site";

/**
 * Middleware Edge.
 *  - {slug}.ROOT_DOMAIN (hanya bila NEXT_PUBLIC_ROOT_DOMAIN diisi):
 *      "/"   → rewrite ke /u/{slug} (query ?to= ikut)
 *      "/og" → rewrite ke /u/{slug}/og (gambar pratinjau link)
 *      /api/*, /media/* → diteruskan; path lain → dialihkan ke "/" (undangan)
 *  - /u/{slug}: header X-Robots-Tag noindex + cookie penanda perangkat tamu
 *    (lihat lib/guestbook/device.ts)
 *  - /dashboard: proteksi login (logika di authConfig.callbacks.authorized)
 */
const authMiddleware = NextAuth(authConfig).auth as unknown as (
  req: NextRequest,
  ev: NextFetchEvent,
) => Promise<Response>;

const NOINDEX = "noindex, nofollow, noarchive";
const PAGE_RE = /^\/u\/[^/]+\/?$/;

/** Respons halaman/gambar undangan: jangan diindeks; halaman → cookie perangkat. */
function invitationResponse(req: NextRequest, res: NextResponse, page: boolean) {
  res.headers.set("X-Robots-Tag", NOINDEX);
  if (page && !parseDeviceId(req.cookies.get(DEVICE_COOKIE)?.value))
    res.cookies.set(
      DEVICE_COOKIE,
      newDeviceId(),
      deviceCookieOptions(
        req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
      ),
    );
  return res;
}

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  const sub = slugFromHost(req.headers.get("host"));
  if (sub) {
    if (pathname === "/" || pathname === "/og") {
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? `/u/${sub}` : `/u/${sub}/og`;
      return invitationResponse(req, NextResponse.rewrite(url), pathname === "/");
    }
    if (pathname.startsWith("/api/") || pathname.startsWith("/media/")) return NextResponse.next();
    // Path lain (mis. /dashboard) → kembali ke halaman undangan di subdomain yang sama.
    // Sengaja bukan ke domain aplikasi: Next mengubah Location ber-origin sama
    // dengan URL internal request menjadi relatif → bisa berputar tanpa henti.
    const home = req.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  if (pathname.startsWith("/u/"))
    return invitationResponse(req, NextResponse.next(), PAGE_RE.test(pathname));
  if (pathname.startsWith("/dashboard")) return authMiddleware(req, ev);
  return NextResponse.next();
}

export const config = {
  // Semua path halaman (subdomain undangan bisa datang ke path mana pun),
  // kecuali aset build & file statis ber-ekstensi.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
