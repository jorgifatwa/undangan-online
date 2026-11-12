import "server-only";

import { createHash } from "node:crypto";

/** IP pengirim dari header proxy (Vercel: x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "0.0.0.0";
}

/**
 * Hash IP HARIAN + rahasia server: cukup untuk rate limit, tidak bisa
 * dibalik ke IP, dan tidak bisa dipakai melacak tamu lintas hari.
 */
export function hashIp(ip: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? ""}|${day}|${ip}`)
    .digest("base64url")
    .slice(0, 32);
}
