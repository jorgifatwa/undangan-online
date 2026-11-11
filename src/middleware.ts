import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/**
 * Middleware Edge.
 * Tahap 1: proteksi /dashboard (logika di authConfig.callbacks.authorized).
 * Tahap berikutnya: rewrite wildcard subdomain {slug}.domain.id → /u/{slug}.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
