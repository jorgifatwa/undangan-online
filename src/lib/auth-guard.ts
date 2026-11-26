import "server-only";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { business } from "@/config/business";
import { NOT_ADMIN_ERROR, canUseDashboard, isAdminEmail } from "@/lib/admin-access";
import { db } from "@/lib/db";

/**
 * Pastikan request berasal dari user yang login.
 * Pakai di setiap server component / server action / route handler yang
 * butuh user — middleware saja tidak cukup (server action bisa dipanggil langsung).
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");
  if (session.user.role === "CUSTOMER") redirect("/akun");
  // Model jasa: dashboard/editor hanya untuk admin — diperiksa di setiap
  // request, termasuk server action, bukan hanya di middleware.
  if (!canUseDashboard(session.user.email, session.user.role))
    redirect(`/masuk?error=${NOT_ADMIN_ERROR}`);
  // Admin dari database (bukan ADMIN_EMAILS): role di JWT bisa basi setelah
  // akses dicabut → periksa ulang ke database di setiap request.
  if (!business.selfService && !isAdminEmail(session.user.email)) {
    const u = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (u?.role !== "ADMIN") redirect(`/masuk?error=${NOT_ADMIN_ERROR}`);
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/**
 * Pembeli (role CUSTOMER): masuk lewat link khusus (/isi/{token}) atau login
 * email/kata sandi yang dibuat admin. Hanya boleh menyentuh undangannya sendiri
 * (findOwnedInvitation memeriksa userId) — bukan dashboard admin.
 */
export async function requireCustomer() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");
  if (session.user.role !== "CUSTOMER") redirect("/masuk");
  return session.user;
}

/**
 * Untuk server action editor yang dipakai admin MAUPUN pembeli. Pemanggil
 * tetap wajib memeriksa kepemilikan (findOwnedInvitation) dan, untuk pembeli,
 * aturan link khusus (lib/claims/guard.ts).
 */
export async function requireMember() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");
  if (session.user.role === "CUSTOMER") return session.user;
  return requireUser();
}
