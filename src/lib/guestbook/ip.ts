import "server-only";

import { createHash } from "node:crypto";

/**
 * IP pengirim dari header proxy. Vercel MENIMPA x-forwarded-for dengan IP asli
 * (anti-pemalsuan); x-vercel-forwarded-for tetap benar walau ada proxy lain di
 * depan Vercel, jadi dibaca lebih dulu. Hosting lain: proxy terdepan wajib
 * menimpa X-Forwarded-For (lihat docs/DEPLOY.md).
 */
export function clientIp(headers: Headers): string {
  const first = (h: string) => headers.get(h)?.split(",")[0]?.trim();
  return (
    first("x-vercel-forwarded-for") || first("x-forwarded-for") || first("x-real-ip") || "0.0.0.0"
  );
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
