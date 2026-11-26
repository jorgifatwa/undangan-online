import { encode } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { findClaimByToken } from "@/lib/claims/service";
import { db } from "@/lib/db";

/**
 * POST /isi/{token}/masuk — buka link khusus = masuk sebagai akun CUSTOMER
 * pemilik undangan. Sengaja POST (tombol), bukan GET: pratinjau link di
 * WhatsApp/peramban tidak ikut membuat sesi. Sesi Auth.js biasa (JWT) sehingga
 * semua pengaman server action berlaku sama.
 */
export const runtime = "nodejs";

const MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const back = new URL(`/isi/${token}`, req.url);

  // tolak POST lintas situs (CSRF login)
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && origin !== "null") {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      /* origin rusak */
    }
    if (!host || originHost !== host) return new NextResponse(null, { status: 403 });
  }

  const { state, claim } = await findClaimByToken(token);
  if (!claim || (state !== "open" && state !== "confirmed"))
    return NextResponse.redirect(back, 303);

  const owner = await db.user.findUnique({ where: { id: claim.invitation.userId } });
  if (!owner || owner.role !== "CUSTOMER") return NextResponse.redirect(back, 303);
  await db.claimLink.update({ where: { id: claim.id }, data: { lastUsedAt: new Date() } });

  const secure =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const jwt = await encode({
    token: {
      sub: owner.id,
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: "CUSTOMER",
    },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
    maxAge: MAX_AGE,
  });
  const res = NextResponse.redirect(back, 303);
  res.cookies.set(cookieName, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: MAX_AGE,
  });
  return res;
}
