/**
 * Aktivasi pembelian tema MANUAL (sebelum pembayaran online / Midtrans ada),
 * mis. setelah pembeli transfer lewat WhatsApp.
 *
 *   pnpm admin:grant-theme <slug-undangan> --by="Nama Admin" [--theme=tirai-beludru] [--note="BCA 14/11"]
 *
 * - Membuat Order LUNAS (paymentType "manual-admin") berisi item yang sama
 *   dengan pesanan online (beli tema / selisih upgrade), lalu menerapkannya
 *   lewat applyPaidOrder — jalur yang sama dengan webhook Midtrans nanti.
 * - Setiap pemakaian dicatat di tabel AdminAudit: siapa (--by + user OS),
 *   kapan, undangan mana, tema, nominal, catatan.
 * - DITOLAK di production (NODE_ENV=production atau host database tercantum di
 *   PROTECTED_DB_HOSTS) kecuali ALLOW_ADMIN_GRANT=1 diisi secara sadar.
 */
import os from "node:os";

import { PrismaClient, type Prisma } from "@prisma/client";

import { applyPaidOrder, createOrder } from "../src/lib/orders/service";
import { formatRupiah } from "../src/lib/format";

const args = process.argv.slice(2);
const opt = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const slug = args.find((a) => !a.startsWith("--"));
const by = opt("by")?.trim();
const themeId = opt("theme");
const note = opt("note") ?? null;

function dbHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "?";
  }
}

function assertAllowed() {
  const host = dbHost().toLowerCase();
  const protectedHosts = (process.env.PROTECTED_DB_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const production =
    process.env.NODE_ENV === "production" || protectedHosts.some((h) => host.includes(h));
  if (production && process.env.ALLOW_ADMIN_GRANT !== "1") {
    console.error(
      `✗ admin:grant-theme DIBATALKAN: database "${host}" adalah PRODUCTION. ` +
        "Jalankan dengan ALLOW_ADMIN_GRANT=1 bila memang disengaja (tetap tercatat di AdminAudit).",
    );
    process.exit(2);
  }
  return { host, production };
}

async function main() {
  if (!slug || !by) {
    console.error(
      'Pakai: pnpm admin:grant-theme <slug-undangan> --by="Nama Admin" [--theme=<id>] [--note="..."]',
    );
    process.exit(1);
  }
  const { host, production } = assertAllowed();
  const db = new PrismaClient();
  try {
    const inv = await db.invitation.findUnique({ where: { slug } });
    if (!inv) throw new Error(`Undangan "${slug}" tidak ditemukan.`);
    const order = await createOrder(
      inv.id,
      { themeId },
      {
        status: "PAID",
        paymentType: "manual-admin",
        midtransOrderId: `MANUAL-${Date.now()}-${inv.id.slice(-6)}`,
      },
    );
    const res = await applyPaidOrder(order.id);
    const actor = `${by} (os:${os.userInfo().username}@${os.hostname()})`;
    await db.adminAudit.create({
      data: {
        actor,
        action: "grant-theme",
        invitationId: inv.id,
        detail: {
          slug,
          themeId: themeId ?? inv.themeId,
          orderId: order.id,
          amount: order.amount,
          items: order.items.map((i) => ({ kind: i.kind, refId: i.refId, amount: i.amount })),
          note,
          dbHost: host,
          production,
        } as Prisma.InputJsonValue,
      },
    });
    const fresh = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
    console.log(
      `✓ ${slug}: ${order.items.map((i) => i.label).join(" + ")} — ${formatRupiah(order.amount)}`,
    );
    console.log(
      `  tema ${fresh.themeId} · kredit ${formatRupiah(fresh.themeCredit)} · dimiliki [${fresh.ownedThemeIds.join(", ")}] · ` +
        `pesanan ${order.id} ${res.applied ? "diterapkan" : "sudah pernah diterapkan"}`,
    );
    console.log(`  tercatat di AdminAudit oleh ${actor}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
