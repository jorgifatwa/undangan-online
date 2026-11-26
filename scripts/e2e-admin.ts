/**
 * Uji fitur pemantauan admin (tanpa browser):
 *
 *   pnpm dev
 *   pnpm e2e:admin [base-url]
 *
 *  - metrik: pendapatan website (lunas) + marketplace (nominal diterima), corong, sumber
 *  - perlu tindakan: link hampir kedaluwarsa & pesanan lunas tanpa email
 *  - semua halaman admin & ekspor CSV terbuka untuk admin
 *  - admin yang dicabut (role di DB bukan ADMIN) langsung ditolak meski JWT masih ADMIN
 *  - penghitung pengunjung: kunci tak dikenal & bot diabaikan
 * Hanya ke database lokal; data uji dibersihkan di akhir.
 */
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

import { assertSafeDatabase } from "./lib/guard";

const base = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const db = new PrismaClient();
const COOKIE = base.startsWith("https") ? "__Secure-authjs.session-token" : "authjs.session-token";
const TAG = "e2e-admin";
let failed = 0;
const check = (ok: unknown, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};

async function session(u: { id: string; name: string | null; email: string | null }) {
  return encode({
    token: { sub: u.id, id: u.id, name: u.name, email: u.email, role: "ADMIN" },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });
}
const get = (path: string, token: string) =>
  fetch(`${base}${path}`, { headers: { cookie: `${COOKIE}=${token}` }, redirect: "manual" });

async function main() {
  assertSafeDatabase("e2e-admin");
  const { getBusinessMetrics, resolvePeriod } = await import("../src/lib/admin/metrics");
  const { getAttention } = await import("../src/lib/admin/attention");
  const { createClaim } = await import("../src/lib/claims/service");
  const created: string[] = [];
  const admin = await db.user.upsert({
    where: { email: "admin-pantau@example.com" },
    create: { email: "admin-pantau@example.com", name: "Admin Pantau", role: "ADMIN" },
    update: { role: "ADMIN" },
  });
  try {
    const period = resolvePeriod({ p: "7" });
    const before = await getBusinessMetrics(period);

    console.log("1. Metrik");
    const order = await db.webOrder.create({
      data: {
        midtransOrderId: `WEB-${TAG.toUpperCase()}-1`,
        themeId: "lili",
        eventType: "WEDDING",
        data: {},
        buyerName: "Pemesan Pantau",
        buyerEmail: `${TAG}@example.com`,
        amount: 99000,
        status: "PAID",
        paidAt: new Date(),
        viewKeyHash: "x".repeat(64),
        claimId: `${TAG}-claim`,
      },
    });
    const c = await createClaim({
      source: "MARKETPLACE",
      themeId: "tirai-beludru",
      customerName: "Pembeli Pantau",
      marketplace: "Shopee",
      receivedAmount: 135000,
    });
    created.push(c.claim.invitationId);
    // link hampir kedaluwarsa
    await db.claimLink.update({
      where: { id: c.claim.id },
      data: { expiresAt: new Date(Date.now() + 2 * 86400_000) },
    });
    const after = await getBusinessMetrics(period);
    check(after.revenue.website - before.revenue.website === 99000, "pendapatan website +99.000");
    check(
      after.revenue.marketplace - before.revenue.marketplace === 135000,
      "pendapatan marketplace memakai nominal diterima (135.000)",
    );
    check(after.orders.total - before.orders.total === 2, "jumlah pesanan +2");
    check(
      after.sources.some((s) => s.label === "Shopee"),
      "sumber Shopee tercatat",
    );
    check(
      after.series.reduce((s, p) => s + p.website + p.marketplace, 0) === after.revenue.total,
      "deret waktu = total pendapatan",
    );
    check(after.funnel.length === 7, "corong 7 langkah");

    console.log("2. Perlu tindakan");
    const a = await getAttention();
    check(
      a.expiring.some((x) => x.id === c.claim.id),
      "link hampir kedaluwarsa muncul",
    );
    check(
      a.emailFailed.some((x) => x.id === order.id),
      "pesanan lunas tanpa email muncul",
    );

    console.log("3. Halaman admin");
    const token = await session(admin);
    for (const p of [
      "/dashboard",
      "/dashboard?p=90",
      "/dashboard/pesanan",
      "/dashboard/pesanan?status=PAID",
      "/dashboard/pengguna",
      "/dashboard/pengguna?tab=pembeli",
      "/dashboard/sistem",
      "/dashboard/link-khusus",
    ]) {
      const r = await get(p, token);
      check(r.status === 200, `${p} → ${r.status}`);
    }
    const csv = await get("/dashboard/pesanan/csv", token);
    const body = await csv.text();
    check(
      csv.status === 200 && body.includes(order.midtransOrderId) && body.includes("No. pesanan"),
      "ekspor CSV berisi pesanan",
    );

    console.log("4. Cabut akses admin");
    await db.user.update({ where: { id: admin.id }, data: { role: "USER" } });
    const r = await get("/dashboard", token);
    check(
      r.status === 307 && (r.headers.get("location") ?? "").includes("/masuk"),
      "JWT lama (role ADMIN) ditolak setelah dicabut",
    );
    const csv2 = await get("/dashboard/pesanan/csv", token);
    check(csv2.status !== 200 || !(await csv2.text()).includes("No. pesanan"), "CSV ditolak");
    const login = await get("/masuk", token);
    check(login.status === 200, "/masuk tidak berputar-putar (menampilkan tombol keluar)");

    console.log("5. Penghitung pengunjung");
    const { wibDay } = await import("../src/lib/analytics/visits");
    const day = wibDay();
    const cnt = async (key: string) =>
      (await db.pageVisit.findUnique({ where: { day_key: { day, key } } }))?.count ?? 0;
    const pre = await cnt("tema");
    await fetch(`${base}/api/hit`, {
      method: "POST",
      body: "bogus",
      headers: { "user-agent": "Mozilla/5.0" },
    });
    await fetch(`${base}/api/hit`, {
      method: "POST",
      body: "tema",
      headers: { "user-agent": "Googlebot/2.1" },
    });
    check((await cnt("tema")) === pre, "bot & kunci tak dikenal diabaikan");
    await fetch(`${base}/api/hit`, {
      method: "POST",
      body: "tema",
      headers: { "user-agent": "Mozilla/5.0" },
    });
    check((await cnt("tema")) === pre + 1, "kunjungan valid dihitung");
    await db.pageVisit.update({ where: { day_key: { day, key: "tema" } }, data: { count: pre } });
  } finally {
    await db.webOrder.deleteMany({ where: { buyerEmail: `${TAG}@example.com` } });
    const owners = await db.invitation.findMany({
      where: { id: { in: created } },
      select: { userId: true },
    });
    await db.invitation.deleteMany({ where: { id: { in: created } } });
    await db.user.deleteMany({
      where: { id: { in: owners.map((o) => o.userId) }, role: "CUSTOMER" },
    });
    await db.user.delete({ where: { id: admin.id } }).catch(() => undefined);
    await db.$disconnect();
  }
  console.log(failed ? `\n✗ ${failed} cek gagal` : "\n✓ semua cek lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
