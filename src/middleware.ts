import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  newDeviceId,
  parseDeviceId,
} from "@/lib/guestbook/device";

/**
 * Middleware Edge.
 *  - /dashboard: proteksi login (logika di authConfig.callbacks.authorized)
 *  - /u/{slug}: beri tamu cookie penanda perangkat (lihat lib/guestbook/device.ts)
 * Tahap 4c: rewrite wildcard subdomain {slug}.domain.id → /u/{slug}.
 */
const authMiddleware = NextAuth(authConfig).auth as unknown as (
  req: NextRequest,
  ev: NextFetchEvent,
) => Promise<Response>;

function withDevice(req: NextRequest, res: NextResponse) {
  if (!parseDeviceId(req.cookies.get(DEVICE_COOKIE)?.value))
    res.cookies.set(
      DEVICE_COOKIE,
      newDeviceId(),
      deviceCookieOptions(req.nextUrl.protocol === "https:"),
    );
  return res;
}

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (req.nextUrl.pathname.startsWith("/u/")) return withDevice(req, NextResponse.next());
  return authMiddleware(req, ev);
}

export const config = {
  matcher: ["/dashboard/:path*", "/u/:path*"],
};
