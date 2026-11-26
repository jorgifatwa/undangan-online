/**
 * Buat / atur ulang akun SUPERADMIN (login email + kata sandi di /masuk).
 *
 *   pnpm admin:create <email> [--name="Nama"] [--password="minimal 12 karakter"]
 *
 * - Akun ber-role ADMIN di database → boleh memakai /dashboard (tanpa perlu
 *   ADMIN_EMAILS). Email yang sudah ada: role dijadikan ADMIN & kata sandi diganti.
 * - Tanpa --password: kata sandi acak dibuat & ditampilkan SEKALI di terminal.
 * - Disimpan sebagai hash bcrypt; dicatat di AdminAudit (tanpa kata sandi).
 * - Production (NODE_ENV=production / PROTECTED_DB_HOSTS) hanya dengan
 *   ALLOW_ADMIN_CREATE=1.
 */
import { randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { adminActor, assertAdminAllowed, cliArgs } from "./lib/admin";

const { opt, positional } = cliArgs();
const emailParsed = z.email().safeParse(positional[0]?.trim().toLowerCase());
if (!emailParsed.success) {
  console.error('Pakai: pnpm admin:create <email> [--name="Nama"] [--password="…"]');
  process.exit(1);
}
const email = emailParsed.data;
const name = opt("name")?.trim() || "Super Admin";
const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const password =
  opt("password") ?? [...randomBytes(16)].map((b) => chars[b % chars.length]).join("");
if (password.length < 12) {
  console.error("✗ Kata sandi minimal 12 karakter.");
  process.exit(1);
}

const db = new PrismaClient();

async function main() {
  const { host } = assertAdminAllowed("admin:create", "ALLOW_ADMIN_CREATE");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, role: "ADMIN", passwordHash, emailVerified: new Date() },
    update: { role: "ADMIN", passwordHash },
  });
  await db.adminAudit.create({
    data: {
      actor: adminActor(process.env.USER ?? "cli"),
      action: "admin.create",
      detail: { email, userId: user.id, db: host },
    },
  });
  console.log(`✓ Superadmin siap (database ${host})`);
  console.log(`  Email      : ${email}`);
  if (!opt("password"))
    console.log(`  Kata sandi : ${password}   ← simpan sekarang, tidak ditampilkan lagi`);
  console.log("  Login di   : /masuk (form email & kata sandi)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
