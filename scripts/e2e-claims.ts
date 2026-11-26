/**
 * Uji fondasi link khusus (tanpa browser):
 *   pnpm e2e:claims
 * buat link → cari lewat token → status open → pengaturan global batas waktu
 * → kedaluwarsa → purge menghapus draf + link; link CONFIRMED tidak dihapus.
 * Hanya ke database lokal (assertSafeDatabase); data uji dibersihkan di akhir.
 */
import { PrismaClient } from "@prisma/client";

import { createClaim, findClaimByToken, purgeExpiredClaims } from "../src/lib/claims/service";
import { getSettings, updateSettings } from "../src/lib/settings";
import { assertSafeDatabase } from "./lib/guard";

const db = new PrismaClient();
let failed = 0;
const check = (ok: unknown, label: string) => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed++;
};

async function main() {
  assertSafeDatabase("e2e-claims");
  const admin = await db.user.upsert({
    where: { email: "admin-claims@test.local" },
    create: { email: "admin-claims@test.local", name: "Admin Uji", role: "ADMIN" },
    update: {},
  });
  const before = await getSettings();
  const created: string[] = [];
  try {
    await updateSettings({ claimLinkDays: 10 });
    check(
      (await getSettings()).claimLinkDays === 10,
      "pengaturan global claimLinkDays tersimpan (10 hari)",
    );

    const now = new Date();
    const { claim, token } = await createClaim(
      {
        source: "MARKETPLACE",
        themeId: "lili",
        customerName: "Pembeli Uji",
        customerPhone: "6281234567890",
        marketplace: "Shopee",
        marketplaceOrder: "SHP-1",
        createdById: admin.id,
      },
      now,
    );
    created.push(claim.invitationId);
    const days = Math.round((claim.expiresAt.getTime() - now.getTime()) / 86400_000);
    check(days === 10, `batas waktu mengikuti pengaturan (${days} hari)`);
    check(/^LK-[A-Z0-9]{4}$/.test(claim.code), `kode ${claim.code}`);
    check(
      token.length === 43 && claim.tokenHash !== token,
      "token mentah tidak disimpan (hanya hash)",
    );

    const inv = await db.invitation.findUniqueOrThrow({ where: { id: claim.invitationId } });
    check(
      inv.status === "DRAFT" &&
        inv.themeId === "lili" &&
        inv.purchasedAt &&
        inv.themeCredit === claim.price,
      "draf undangan dibuat, tema terbayar, kredit = harga",
    );
    check(inv.slug.startsWith("draf-"), `alamat sementara ${inv.slug}`);
    const owner = await db.user.findUniqueOrThrow({ where: { id: inv.userId } });
    check(
      owner.role === "CUSTOMER" && owner.email === null && owner.name === "Pembeli Uji",
      "pemilik draf = akun CUSTOMER baru (tanpa email)",
    );

    check((await findClaimByToken(token)).state === "open", "token valid → open");
    check((await findClaimByToken("x".repeat(43))).state === "not-found", "token asal → not-found");
    check(
      (await findClaimByToken(token, new Date(claim.expiresAt.getTime() + 1))).state === "expired",
      "lewat batas waktu → expired",
    );

    // link kedua dikonfirmasi: tidak boleh ikut terhapus
    const second = await createClaim(
      {
        source: "MARKETPLACE",
        themeId: "lili",
        customerName: "Pembeli Dua",
      },
      now,
    );
    created.push(second.claim.invitationId);
    await db.claimLink.update({
      where: { id: second.claim.id },
      data: { status: "CONFIRMED", confirmedAt: now },
    });

    const later = new Date(claim.expiresAt.getTime() + 60_000);
    const r = await purgeExpiredClaims(later);
    check(r.deleted >= 1, `purge menghapus ${r.deleted} draf kedaluwarsa`);
    check(
      !(await db.invitation.findUnique({ where: { id: claim.invitationId } })),
      "draf link kedaluwarsa terhapus",
    );
    check(
      !(await db.claimLink.findUnique({ where: { id: claim.id } })),
      "link kedaluwarsa ikut terhapus (cascade)",
    );
    check(
      !(await db.user.findUnique({ where: { id: inv.userId } })),
      "akun CUSTOMER tanpa undangan ikut terhapus",
    );
    check(
      !!(await db.claimLink.findUnique({ where: { id: second.claim.id } })),
      "link yang sudah dikonfirmasi tetap ada",
    );
  } finally {
    const owners = await db.invitation.findMany({
      where: { id: { in: created } },
      select: { userId: true },
    });
    await db.invitation.deleteMany({ where: { id: { in: created } } });
    await db.user.deleteMany({
      where: { id: { in: owners.map((o) => o.userId) }, role: "CUSTOMER" },
    });
    await updateSettings({ claimLinkDays: before.claimLinkDays });
    await db.$disconnect();
  }
  console.log(failed ? `\n✗ ${failed} cek gagal` : "\n✓ semua cek lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
