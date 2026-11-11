import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

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
    /** Dipanggil middleware: tentukan rute mana yang butuh login. */
    authorized({ auth, request: { nextUrl } }) {
      const isProtected = nextUrl.pathname.startsWith("/dashboard");
      if (isProtected) return Boolean(auth?.user);
      return true;
    },
    jwt({ token, user }) {
      // `user` hanya ada saat login pertama; simpan id & role ke token.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      // Narrowing eksplisit: tipe JWT di next-auth beta tidak selalu ter-augment.
      if (typeof token.id === "string") session.user.id = token.id;
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;
