/**
 * Uji model HARGA PER TEMA (tanpa browser; tidak butuh server).
 *
 *   pnpm e2e:pricing
 *
 *  - harga dari manifest, hak pakai draf vs dibeli (tanpa masa uji), batas galeri & lagu, add-on
 *  - aturan ganti tema: draf bebas, dimiliki/lebih murah gratis, lebih mahal → selisih
 *  - pesanan: beli tema → lunas → diterapkan (idempoten), upgrade bayar selisih
 *  - checklist terbit menolak tema yang belum dibayar
 *  - migrasi data lama: tanpa kolom package & expiresAt; terbit = sudah dibeli
 *  - pnpm admin:grant-theme: ditolak di production tanpa izin, tercatat di AdminAudit
 */
import { execFileSync } from "node:child_process";

import { PrismaClient, type Prisma } from "@prisma/client";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { publishChecklist } from "../src/lib/invitations/publish";
import { applyPaidOrder, createOrder, invitationAddons } from "../src/lib/orders/service";
import {
  buildOrderLines,
  getEntitlements,
  LIMITS,
  PricingError,
  quoteTheme,
  SHARE_PREVIEW_ENTITLEMENTS,
  STORAGE_QUOTA_MB,
  themePrice,
} from "../src/lib/pricing";
import { ADDONS } from "../src/lib/pricing/addons";
import { assertSafeDatabase } from "./lib/guard";

const db = new PrismaClient();
const DAY = 86400_000;
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};
const throws = (fn: () => unknown) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
};

async function wedding(slug: string, themeId: string) {
  const owner = await db.user.upsert({
    where: { email: "e2e-a@test.local" },
    update: {},
    create: { email: "e2e-a@test.local", name: "Uji A" },
  });
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Laras Ayu",
    brideNickname: "Laras",
    groomName: "Bima Satria",
    groomNickname: "Bima",
    date: new Date(Date.now() + 60 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Bandung",
    greeting: "umum",
    themeId,
  }).data;
  return db.invitation.create({
    data: {
      userId: owner.id,
      slug,
      eventType: "WEDDING",
      themeId,
      data: data as Prisma.InputJsonValue,
    },
  });
}

async function main() {
  assertSafeDatabase("e2e-pricing");

  console.log("Harga dari manifest");
  check(themePrice("confetti-party") === 49_000, "Confetti Party Rp49.000");
  check(themePrice("renda-rimba") === 99_000, "Renda Rimba Rp99.000");
  check(themePrice("tirai-beludru") === 149_000, "Tirai Beludru Rp149.000");

  console.log("Hak pakai");
  const draft = { themeId: "renda-rimba", purchasedAt: null, themeCredit: 0, ownedThemeIds: [] };
  const bought = {
    themeId: "renda-rimba",
    purchasedAt: new Date(),
    themeCredit: 99_000,
    ownedThemeIds: ["renda-rimba"],
  };
  const et = getEntitlements(draft);
  const eb = getEntitlements(bought);
  check(!et.purchased && eb.purchased, "draf: belum dibeli; dibeli: purchased");
  check(!("watermark" in et) && !("trial" in et), "tidak ada lagi hak pakai watermark/masa uji");
  check(
    et.galleryLimit === LIMITS.galleryPhotos && eb.galleryLimit === 12,
    "galeri 12 foto (sama untuk draf & dibeli)",
  );
  check(et.customMusic && et.customMusicTracks === 3, "draf: unggah musik terbuka, maks. 3 lagu");
  check(
    et.storageQuotaMb === STORAGE_QUOTA_MB.draft &&
      et.storageQuotaMb === 50 &&
      eb.storageQuotaMb === 100,
    "kuota pengaman: 50 MB draf, 100 MB dibeli",
  );
  check(
    et.digitalEnvelope && eb.digitalEnvelope,
    "amplop bisa diisi & dipratinjau di draf (halaman tamu hanya ada setelah dibeli & terbit)",
  );
  check(
    !SHARE_PREVIEW_ENTITLEMENTS.rsvp &&
      !SHARE_PREVIEW_ENTITLEMENTS.wishes &&
      !SHARE_PREVIEW_ENTITLEMENTS.digitalEnvelope,
    "link pratinjau: RSVP, ucapan & amplop nonaktif",
  );
  check(
    getEntitlements(bought, [{ addonId: "extra-gallery", quantity: 1 }]).galleryLimit === 24,
    "add-on Foto galeri tambahan menaikkan batas (12 → 24)",
  );
  check(
    ADDONS.every((a) => a.price === null) && ADDONS.some((a) => a.id === "extra-gallery"),
    "add-on disiapkan (harga null = Segera hadir)",
  );
  check(
    throws(() =>
      buildOrderLines(bought, { addons: [{ addonId: "extra-gallery", qty: 1 }] }),
    ) instanceof PricingError,
    "add-on yang belum dijual tidak bisa dipesan",
  );

  console.log("Ganti tema");
  check(quoteTheme(draft, "tirai-beludru")?.kind === "buy", "draf: semua tema bebas dicoba");
  check(quoteTheme(bought, "renda-rimba")?.kind === "owned", "tema yang dibeli: dimiliki");
  const up = quoteTheme(bought, "tirai-beludru");
  check(up?.kind === "upgrade" && up.amount === 50_000, "ke tema lebih mahal: selisih Rp50.000");
  const birthdayBought = {
    themeId: "renda-rimba",
    purchasedAt: new Date(),
    themeCredit: 99_000,
    ownedThemeIds: ["renda-rimba"],
  };
  check(
    quoteTheme(birthdayBought, "confetti-party")?.kind === "owned",
    "ke tema lebih murah: gratis (tanpa pengembalian dana)",
  );
  check(
    throws(() => buildOrderLines(bought)) instanceof PricingError,
    "tema yang sudah dibeli: tidak ada yang perlu dibayar",
  );

  console.log("Pesanan: beli tema → lunas → diterapkan");
  const inv = await wedding("uji-harga-tema", "renda-rimba");
  const o1 = await createOrder(inv.id);
  check(
    o1.status === "PENDING" &&
      o1.amount === 99_000 &&
      o1.items.length === 1 &&
      o1.items[0].kind === "THEME" &&
      o1.items[0].refId === "renda-rimba",
    "pesanan: 1 item THEME Renda Rimba Rp99.000 (PENDING)",
  );
  check(
    (await applyPaidOrder(o1.id).then(
      () => false,
      () => true,
    )) === true,
    "pesanan belum lunas tidak bisa diterapkan",
  );
  await db.order.update({ where: { id: o1.id }, data: { status: "PAID", paidAt: new Date() } });
  const r1 = await applyPaidOrder(o1.id);
  let row = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  check(
    r1.applied &&
      !!row.purchasedAt &&
      row.themeCredit === 99_000 &&
      row.ownedThemeIds.join() === "renda-rimba" &&
      row.status === "DRAFT",
    "lunas → dibeli, kredit Rp99.000 (status tidak diubah; pemilik yang menerbitkan)",
  );
  const r1b = await applyPaidOrder(o1.id);
  row = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  check(
    !r1b.applied && row.themeCredit === 99_000,
    "diterapkan dua kali (webhook ganda) → kredit tidak ganda",
  );

  console.log("Upgrade: bayar selisih");
  const o2 = await createOrder(inv.id, { themeId: "tirai-beludru" });
  check(
    o2.amount === 50_000 && o2.items[0].kind === "THEME_UPGRADE",
    "pesanan upgrade: THEME_UPGRADE Rp50.000",
  );
  await db.order.update({ where: { id: o2.id }, data: { status: "PAID", paidAt: new Date() } });
  await applyPaidOrder(o2.id);
  row = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  check(
    row.themeId === "tirai-beludru" &&
      row.themeCredit === 149_000 &&
      row.ownedThemeIds.includes("renda-rimba") &&
      row.ownedThemeIds.includes("tirai-beludru"),
    "setelah lunas: tema Tirai, kredit Rp149.000, Renda & Tirai dimiliki",
  );
  check(quoteTheme(row, "renda-rimba")?.kind === "owned", "kembali ke Renda: gratis");
  check((await invitationAddons(inv.id)).length === 0, "tanpa add-on");

  console.log("Checklist terbit menolak tema yang belum dibayar");
  const inv2 = await wedding("uji-harga-selisih", "renda-rimba");
  await db.invitation.update({
    where: { id: inv2.id },
    data: {
      purchasedAt: new Date(),
      themeCredit: 99_000,
      ownedThemeIds: ["renda-rimba"],
      // tema diubah langsung di DB (meniru editor yang diakali)
      themeId: "tirai-beludru",
    },
  });
  const items = publishChecklist(await db.invitation.findUniqueOrThrow({ where: { id: inv2.id } }));
  const theme = items.find((i) => i.key === "theme");
  check(
    !!theme && !theme.ok && /Bayar selisih Rp50\.000/.test(theme.message ?? ""),
    `checklist: "${theme?.message}"`,
  );

  console.log("Migrasi data lama");
  const cols = (await db.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name IN ('Invitation', 'Order') AND column_name = 'package'`) as unknown[];
  check(cols.length === 0, "kolom package sudah tidak ada");
  const boughtRows = await db.invitation.findMany({
    // kecuali undangan uji di atas yang SENGAJA dibuat tidak konsisten
    where: { purchasedAt: { not: null }, NOT: { slug: { startsWith: "uji-harga-" } } },
    select: { themeId: true, themeCredit: true, ownedThemeIds: true },
  });
  check(
    boughtRows.every(
      (r) => r.ownedThemeIds.includes(r.themeId) || r.themeCredit >= (themePrice(r.themeId) ?? 0),
    ),
    `${boughtRows.length} undangan yang sudah dibeli: tema dimiliki`,
  );
  const exp = (await db.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Invitation' AND column_name = 'expiresAt'`) as unknown[];
  check(exp.length === 0, "kolom expiresAt sudah tidak ada");
  const unpaidLive = await db.invitation.count({
    where: { status: "PUBLISHED", purchasedAt: null },
  });
  check(unpaidLive === 0, "tidak ada undangan terbit yang belum dibeli");

  console.log("pnpm admin:grant-theme");
  const inv3 = await wedding("uji-harga-admin", "tirai-beludru");
  const run = (env: Record<string, string>, ...extra: string[]) => {
    try {
      const out = execFileSync(
        "pnpm",
        [
          "-s",
          "admin:grant-theme",
          "uji-harga-admin",
          "--by=Admin Uji",
          "--note=transfer uji",
          ...extra,
        ],
        { env: { ...process.env, ...env }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      return { code: 0, out };
    } catch (e) {
      const err = e as { status: number; stderr: string; stdout: string };
      return { code: err.status, out: `${err.stdout}${err.stderr}` };
    }
  };
  const prod = run({ NODE_ENV: "production" });
  check(
    prod.code === 2 && /PRODUCTION/.test(prod.out),
    "production tanpa ALLOW_ADMIN_GRANT → ditolak",
  );
  const host = new URL(process.env.DATABASE_URL!).hostname;
  const prot = run({ PROTECTED_DB_HOSTS: host });
  check(prot.code === 2, "host di PROTECTED_DB_HOSTS → ditolak");
  check(
    !(await db.invitation.findUniqueOrThrow({ where: { id: inv3.id } })).purchasedAt,
    "penolakan tidak mengubah apa pun",
  );
  const noBy = (() => {
    try {
      execFileSync("pnpm", ["-s", "admin:grant-theme", "uji-harga-admin"], { stdio: "pipe" });
      return 0;
    } catch (e) {
      return (e as { status: number }).status;
    }
  })();
  check(noBy === 1, "tanpa --by (pelaku) → ditolak");
  const ok = run({});
  console.log(
    ok.out
      .split("\n")
      .map((l) => `      ${l}`)
      .join("\n")
      .trimEnd(),
  );
  row = await db.invitation.findUniqueOrThrow({ where: { id: inv3.id } });
  check(
    ok.code === 0 && !!row.purchasedAt && row.themeCredit === 149_000,
    "staging/lokal: tema diaktifkan",
  );
  const order = await db.order.findFirst({
    where: { invitationId: inv3.id },
    include: { items: true },
  });
  check(
    order?.status === "PAID" && order.paymentType === "manual-admin" && !!order.appliedAt,
    "tercatat sebagai pesanan manual LUNAS & diterapkan",
  );
  const audit = await db.adminAudit.findFirst({
    where: { invitationId: inv3.id, action: "grant-theme" },
    orderBy: { createdAt: "desc" },
  });
  const detail = audit?.detail as { amount?: number; note?: string; orderId?: string } | undefined;
  check(
    !!audit &&
      audit.actor.startsWith("Admin Uji (os:") &&
      detail?.amount === 149_000 &&
      detail.note === "transfer uji" &&
      detail.orderId === order?.id,
    `AdminAudit: ${audit?.actor} · ${audit?.createdAt.toISOString()}`,
  );

  for (const s of ["uji-harga-tema", "uji-harga-selisih", "uji-harga-admin"])
    await db.invitation.deleteMany({ where: { slug: s } });
  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
