"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { newPassword } from "@/lib/admin/password";
import { isAdminEmail } from "@/lib/admin-access";
import { requireAdmin } from "@/lib/auth-guard";
import { customerLoginUrl } from "@/lib/claims/messages";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";

/**
 * KELOLA PENGGUNA (admin): tambah admin, atur ulang kata sandi admin/pembeli,
 * cabut akses admin. Kata sandi hanya ditampilkan sekali; semua dicatat di AdminAudit.
 */
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const PATH = "/dashboard/pengguna";

async function audit(actor: string, action: string, detail: object) {
  await db.adminAudit.create({ data: { actor, action, detail } });
}

function loginText(name: string | null, email: string, password: string) {
  return [
    `Halo ${name ?? ""}, berikut data login ${siteConfig.name}:`.replace("Halo ,", "Halo,"),
    customerLoginUrl(),
    `Email: ${email}`,
    `Kata sandi: ${password}`,
    "",
    "Simpan baik-baik dan jangan bagikan kata sandi ke orang lain.",
  ].join("\n");
}

const addSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
  email: z.email("Email tidak valid").transform((v) => v.trim().toLowerCase()),
});

/** Tambah admin baru (atau jadikan admin akun yang sudah ada & bukan pembeli). */
export async function addAdminAction(raw: unknown): Promise<R<{ message: string; email: string }>> {
  const admin = await requireAdmin();
  const p = addSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const { name, email } = p.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.role === "CUSTOMER")
    return { ok: false, error: "Email ini dipakai akun pembeli. Gunakan email lain untuk admin." };
  if (existing?.role === "ADMIN") return { ok: false, error: "Email ini sudah admin." };
  const password = newPassword(14);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", passwordHash } })
    : await db.user.create({
        data: { name, email, role: "ADMIN", passwordHash, emailVerified: new Date() },
      });
  await audit(admin.email ?? admin.id, "user.addAdmin", { userId: user.id, email });
  revalidatePath(PATH);
  return { ok: true, email, message: loginText(name, email, password) };
}

/** Atur ulang kata sandi admin atau pembeli (yang sudah punya email login). */
export async function resetPasswordAction(
  userId: string,
): Promise<R<{ message: string; email: string }>> {
  const admin = await requireAdmin();
  const user = await db.user.findUnique({ where: { id: String(userId) } });
  if (!user?.email) return { ok: false, error: "Akun belum punya email login." };
  if (user.role !== "ADMIN" && user.role !== "CUSTOMER")
    return { ok: false, error: "Hanya akun admin atau pembeli." };
  const password = newPassword(user.role === "ADMIN" ? 14 : 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, user.role === "ADMIN" ? 12 : 10) },
  });
  await audit(admin.email ?? admin.id, "user.resetPassword", { userId: user.id, role: user.role });
  return { ok: true, email: user.email, message: loginText(user.name, user.email, password) };
}

/** Cabut akses admin (akun tetap ada sebagai pengguna biasa, kata sandi dihapus). */
export async function revokeAdminAction(userId: string): Promise<R> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "Tidak bisa mencabut akses akun sendiri." };
  const user = await db.user.findUnique({ where: { id: String(userId) } });
  if (!user || user.role !== "ADMIN") return { ok: false, error: "Akun ini bukan admin." };
  if (isAdminEmail(user.email))
    return { ok: false, error: "Admin ini terdaftar di ADMIN_EMAILS (env) — hapus dari env." };
  const others = await db.user.count({ where: { role: "ADMIN", NOT: { id: user.id } } });
  if (others === 0) return { ok: false, error: "Harus ada minimal satu admin." };
  await db.user.update({ where: { id: user.id }, data: { role: "USER", passwordHash: null } });
  await db.session.deleteMany({ where: { userId: user.id } });
  await audit(admin.email ?? admin.id, "user.revokeAdmin", { userId: user.id, email: user.email });
  revalidatePath(PATH);
  return { ok: true };
}
