import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { NOT_ADMIN_ERROR, canUseDashboard, isAdminEmail } from "@/lib/admin-access";

/**
 * Konfigurasi Auth.js yang AMAN untuk Edge runtime (dipakai middleware).
 * Jangan impor Prisma / bcrypt di sini — itu ada di src/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/masuk",
    error: "/masuk",
  },
  // JWT wajib agar provider Credentials (email/password) bisa dipakai nanti,
  // dan agar middleware bisa membaca session tanpa query database.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      // Email Google sudah terverifikasi, jadi aman menautkan ke akun
      // email/password yang memakai alamat sama.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    /**
     * Model jasa: hanya email admin (ADMIN_EMAILS) yang boleh masuk. Ditolak
     * SEBELUM akun dibuat, jadi email lain tidak pernah tersimpan.
     */
    signIn({ user }) {
      if (canUseDashboard(user?.email)) return true;
      return `/masuk?error=${NOT_ADMIN_ERROR}`;
    },
    /** Dipanggil middleware: tentukan rute mana yang butuh login. */
    authorized({ auth, request: { nextUrl } }) {
      const isProtected = nextUrl.pathname.startsWith("/dashboard");
      if (isProtected) return Boolean(auth?.user) && canUseDashboard(auth?.user?.email);
      return true;
    },
    jwt({ token, user }) {
      // `user` hanya ada saat login pertama; simpan id & role ke token.
      if (user?.id) {
        token.id = user.id;
        token.role = isAdminEmail(user.email) ? "ADMIN" : (user.role ?? "USER");
      }
      return token;
    },
    session({ session, token }) {
      // Narrowing eksplisit: tipe JWT di next-auth beta tidak selalu ter-augment.
      if (typeof token.id === "string") session.user.id = token.id;
      session.user.role =
        token.role === "ADMIN" ? "ADMIN" : token.role === "CUSTOMER" ? "CUSTOMER" : "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;
