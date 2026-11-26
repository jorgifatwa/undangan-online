import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  newDeviceId,
  parseDeviceId,
} from "@/lib/guestbook/device";
import { RESERVED_SLUGS, SLUG_RE } from "@/lib/invitations/reserved";

/**
 * Middleware Edge.
 *  - /{slug} (halaman undangan) & /{slug}/og (gambar pratinjau): header
 *    X-Robots-Tag noindex; halaman → cookie penanda perangkat tamu
 *    (lihat lib/guestbook/device.ts)
 *  - /p/{token} (link pratinjau rahasia): noindex, no-referrer, no-store
 *  - /isi/{token} (link khusus pembeli): sama seperti /p/ (token di URL)
 *  - /dashboard & /akun: proteksi login (logika di authConfig.callbacks.authorized)
 * Tautan lama /u/{slug} dialihkan 301 di next.config.ts (sebelum middleware).
 */
const authMiddleware = NextAuth(authConfig).auth as unknown as (
  req: NextRequest,
  ev: NextFetchEvent,
) => Promise<Response>;

const NOINDEX = "noindex, nofollow, noarchive";
const INVITATION_PATH = /^\/([^/]+)(\/og)?\/?$/;

/** { page } bila path adalah halaman/gambar undangan, selain itu null. */
function invitationPath(pathname: string) {
  const m = INVITATION_PATH.exec(pathname);
  if (!m || !SLUG_RE.test(m[1]) || RESERVED_SLUGS.has(m[1])) return null;
  return { page: !m[2] };
}

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  const inv = invitationPath(pathname);
  if (inv) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", NOINDEX);
    if (inv.page && !parseDeviceId(req.cookies.get(DEVICE_COOKIE)?.value))
      res.cookies.set(
        DEVICE_COOKIE,
        newDeviceId(),
        deviceCookieOptions(
          req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
        ),
      );
    return res;
  }
  if (pathname.startsWith("/p/") || pathname.startsWith("/isi/")) {
    // Link pratinjau rahasia: jangan diindeks & jangan bocorkan token lewat Referer.
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", NOINDEX);
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  if (pathname.startsWith("/dashboard") || pathname === "/akun" || pathname.startsWith("/akun/"))
    return authMiddleware(req, ev);
  return NextResponse.next();
}

export const config = {
  // Semua path halaman kecuali aset build & file statis ber-ekstensi.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
