/**
 * Uji akses model jasa (business.selfService = false): hanya admin yang bisa
 * masuk & memakai dashboard/editor.
 *
 *   pnpm dev
 *   pnpm e2e:akses [base-url]
 */
import { encode } from "next-auth/jwt";

import { authConfig } from "../src/auth.config";
import { business } from "../src/config/business";
import { NOT_ADMIN_ERROR, isAdminEmail } from "../src/lib/admin-access";

const base = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3000";
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};

const token = (email: string, role: "USER" | "ADMIN") =>
  encode({
    token: { sub: `uji-${email}`, id: `uji-${email}`, name: "Uji", email, role },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
const get = async (path: string, email?: string, role: "USER" | "ADMIN" = "USER") =>
  fetch(`${base}${path}`, {
    redirect: "manual",
    headers: email ? { cookie: `authjs.session-token=${await token(email, role)}` } : {},
  });

async function main() {
  console.log("Aturan email admin");
  check(business.selfService === false, "layanan mandiri nonaktif (model jasa)");
  const saved = { list: process.env.ADMIN_EMAILS, env: process.env.NODE_ENV };
  process.env.ADMIN_EMAILS = " Admin@Contoh.com , kedua@contoh.com";
  check(
    isAdminEmail("admin@contoh.com") && isAdminEmail("KEDUA@contoh.com"),
    "ADMIN_EMAILS (huruf besar/kecil & spasi diabaikan)",
  );
  check(!isAdminEmail("pelanggan@gmail.com") && !isAdminEmail(null), "email lain bukan admin");
  check(isAdminEmail("e2e-a@test.local"), "di luar production: akun uji @test.local = admin");
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  check(!isAdminEmail("e2e-a@test.local"), "production: @test.local BUKAN admin");
  (process.env as Record<string, string | undefined>).NODE_ENV = saved.env;
  process.env.ADMIN_EMAILS = saved.list;

  console.log("Login (callback signIn)");
  const signIn = authConfig.callbacks.signIn as (p: { user: { email: string } }) => unknown;
  check(
    signIn({ user: { email: "pelanggan@gmail.com" } }) === `/masuk?error=${NOT_ADMIN_ERROR}`,
    "email non-admin ditolak sebelum akun dibuat → /masuk?error=BukanAdmin",
  );
  check(signIn({ user: { email: "e2e-a@test.local" } }) === true, "email admin diterima");

  console.log("Halaman & API");
  for (const path of ["/dashboard", "/dashboard/undangan/baru"]) {
    const anon = await get(path);
    check(
      anon.status >= 300 &&
        anon.status < 400 &&
        (anon.headers.get("location") ?? "").includes("/masuk"),
      `${path}: tanpa login → /masuk`,
    );
    const user = await get(path, "pelanggan@gmail.com");
    check(
      user.status >= 300 &&
        user.status < 400 &&
        (user.headers.get("location") ?? "").includes("/masuk"),
      `${path}: sesi email non-admin → /masuk`,
    );
    const admin = await get(path, "e2e-akses@test.local", "ADMIN");
    check(admin.status === 200, `${path}: admin → 200 (dapat ${admin.status})`);
  }
  const masuk = await get("/masuk", "pelanggan@gmail.com");
  const html = await masuk.text();
  check(
    masuk.status === 200 && html.includes("khusus admin") && html.includes("Keluar dari akun ini"),
    "/masuk dengan sesi non-admin: pesan ramah + tombol keluar (tanpa putaran redirect)",
  );
  const err = await (await get(`/masuk?error=${NOT_ADMIN_ERROR}`)).text();
  check(
    err.includes("Halaman ini khusus admin") && err.includes("Lihat tema"),
    "/masuk?error=BukanAdmin: pesan ramah + tautan ke tema",
  );
  const proc = await fetch(`${base}/api/media/apa-saja/process`, {
    method: "POST",
    headers: { cookie: `authjs.session-token=${await token("pelanggan@gmail.com", "USER")}` },
  });
  check(proc.status === 403, `API proses musik: non-admin → 403 (dapat ${proc.status})`);

  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
