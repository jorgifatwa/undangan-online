/**
 * Siapa yang boleh masuk & memakai dashboard/editor.
 * Aman untuk Edge (dipakai middleware & callback Auth.js) — tanpa Prisma.
 *
 * Model jasa (business.selfService = false): hanya email admin.
 *  - ADMIN_EMAILS (env): daftar email dipisah koma, huruf besar/kecil diabaikan.
 *  - Di luar production, email @test.local (akun uji e2e; tidak bisa dipakai
 *    login Google & sesi hanya bisa dibuat dengan AUTH_SECRET) dianggap admin.
 * Diperiksa ulang di setiap request (requireUser), jadi email yang dihapus dari
 * ADMIN_EMAILS langsung kehilangan akses meski sesinya masih berlaku.
 */
import { business } from "@/config/business";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (adminEmails().includes(e)) return true;
  return process.env.NODE_ENV !== "production" && e.endsWith("@test.local");
}

/**
 * Boleh memakai dashboard/editor: semua user (layanan mandiri) atau admin saja.
 * Admin = email di ADMIN_EMAILS ATAU akun ber-role ADMIN di database (dibuat
 * lewat `pnpm admin:create`, login email + kata sandi).
 */
export function canUseDashboard(email: string | null | undefined, role?: string | null): boolean {
  return business.selfService || isAdminEmail(email) || role === "ADMIN";
}

/** Kode error di /masuk?error=… untuk email yang bukan admin. */
export const NOT_ADMIN_ERROR = "BukanAdmin";
