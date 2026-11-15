/**
 * Uji kuota penyimpanan PER UNDANGAN & retensi media DRAF (development).
 *  - draf belum dibeli & tidak diubah pengguna 90 hari (lastEditedAt) → foto &
 *    musik dihapus cron; teks tetap. Peringatan dashboard 7 hari sebelumnya.
 *  - cron & admin tidak mengubah lastEditedAt; simpan di editor memulai ulang hitungan.
 *
 *   pnpm dev
 *   pnpm e2e:retention [base-url] [--shots=.reference/report/3c-fix]
 */
import fs from "node:fs";
import path from "node:path";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import sharp from "sharp";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { cleanupMedia, requestUpload, UploadError } from "../src/lib/media/service";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";
import { planFields } from "./lib/purchase";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const UPLOADS = path.join(process.cwd(), ".uploads");
const DAY = 86400_000;
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};

async function invitation(
  userId: string,
  slug: string,
  plan: "draft" | "paid",
  lastEditedAt: Date = new Date(),
) {
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Retno Ayu",
    brideNickname: "Retno",
    groomName: "Dimas Arya",
    groomNickname: "Dimas",
    date: "2027-03-01",
    timezone: "WIB",
    city: "Malang",
    greeting: "umum",
    themeId: "renda-rimba",
  }).data;
  return db.invitation.create({
    data: {
      userId,
      slug,
      eventType: "WEDDING",
      themeId: "renda-rimba",
      ...planFields(plan, "renda-rimba"),
      status: plan === "paid" ? "PUBLISHED" : "DRAFT",
      publishedAt: plan === "paid" ? lastEditedAt : null,
      lastEditedAt,
      data: data as Prisma.InputJsonValue,
    },
  });
}

/** File media sungguhan di .uploads + baris Media READY + rujukan di data. */
async function attachPhoto(userId: string, invId: string) {
  const media = await db.media.create({
    data: {
      userId,
      invitationId: invId,
      kind: "PHOTO",
      slot: "cover",
      status: "READY",
      bytes: 1000,
    },
  });
  const key = `m/${invId}/${media.id}.webp`;
  fs.mkdirSync(path.join(UPLOADS, "m", invId), { recursive: true });
  await sharp({ create: { width: 40, height: 50, channels: 3, background: "#777" } })
    .webp()
    .toFile(path.join(UPLOADS, key));
  await db.media.update({ where: { id: media.id }, data: { key } });
  const inv = await db.invitation.findUnique({ where: { id: invId } });
  const data = inv!.data as Record<string, unknown> & { photos: Record<string, unknown> };
  data.photos = { ...data.photos, cover: { url: `/media/${key}` } };
  data.gallery = [{ url: `/media/${key}` }, { url: "https://contoh.luar/foto.jpg" }];
  // perubahan sistem (bukan editor) → lastEditedAt TIDAK disentuh
  await db.invitation.update({
    where: { id: invId },
    data: { data: data as Prisma.InputJsonValue },
  });
  return key;
}

async function main() {
  assertSafeDatabase("e2e-retention");
  const u = await db.user.upsert({
    where: { email: "e2e-r@test.local" },
    update: {},
    create: { email: "e2e-r@test.local", name: "Uji Retensi" },
  });
  await db.media.deleteMany({ where: { userId: u.id } });
  await db.invitation.deleteMany({ where: { userId: u.id } });

  console.log("Kuota per undangan");
  const free = await invitation(u.id, "uji-kuota-free", "draft");
  const basic = await invitation(u.id, "uji-kuota-basic", "paid");
  await db.media.create({
    data: {
      userId: u.id,
      invitationId: free.id,
      kind: "PHOTO",
      slot: "gallery",
      status: "READY",
      key: "m/x/penuh.webp",
      bytes: 50 * 1024 * 1024 - 10 * 1024,
    },
  });
  const freeErr = await requestUpload(u.id, free.id, {
    kind: "PHOTO",
    slot: "cover",
    contentType: "image/jpeg",
    size: 500_000,
  }).then(
    () => null,
    (e: unknown) => e,
  );
  check(
    freeErr instanceof UploadError && freeErr.code === "QUOTA",
    "draf penuh (50 MB) → ditolak dengan kode QUOTA",
  );
  const basicOk = await requestUpload(u.id, basic.id, {
    kind: "PHOTO",
    slot: "cover",
    contentType: "image/jpeg",
    size: 500_000,
  }).then(
    () => true,
    () => false,
  );
  check(basicOk, "undangan yang sudah dibeli (akun sama) tetap bisa upload (kuota per undangan)");
  await db.media.deleteMany({ where: { userId: u.id } });
  await db.invitation.deleteMany({ where: { userId: u.id } });

  console.log("Retensi media draf (90 hari sejak diubah pengguna)");
  const now = Date.now();
  // dihapus 6 hari lagi (84 hari tidak diubah)
  const warn = await invitation(u.id, "uji-retensi-peringatan", "draft", new Date(now - 84 * DAY));
  const purge = await invitation(u.id, "uji-retensi-hapus", "draft", new Date(now - 91 * DAY));
  const fresh = await invitation(u.id, "uji-retensi-baru", "draft", new Date(now - 30 * DAY));
  const paid = await invitation(u.id, "uji-retensi-dibeli", "paid", new Date(now - 400 * DAY));
  const warnKey = await attachPhoto(u.id, warn.id);
  const purgeKey = await attachPhoto(u.id, purge.id);
  const freshKey = await attachPhoto(u.id, fresh.id);
  const paidKey = await attachPhoto(u.id, paid.id);
  const purgeEditedBefore = (await db.invitation.findUniqueOrThrow({ where: { id: purge.id } }))
    .lastEditedAt;

  const token = await encode({
    token: { sub: u.id, id: u.id, name: u.name, email: u.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0", timeout: 90000 });
  const t1 = (await page.evaluate("document.body.innerText")) as string;
  check(
    /akan dihapus pada/.test(t1) && /6 hari lagi/.test(t1),
    "peringatan 7 hari sebelum penghapusan tampil di dashboard",
  );
  check(
    t1.includes("beli tema") && t1.includes("tidak diubah selama") && t1.includes("90 hari"),
    "peringatan menjelaskan aturan 90 hari & menawarkan beli tema",
  );
  check(!/masa uji|uji coba/i.test(t1), "dashboard tanpa teks masa uji");
  check(t1.includes("Draf · belum dibeli"), "label: Draf · belum dibeli");
  if (shots)
    await page.screenshot({
      path: `${shots}/dashboard-peringatan-retensi.png` as `${string}.png`,
      fullPage: true,
    });

  const report = await cleanupMedia();
  check(
    report.retentionPurged === 1,
    `cron: tepat 1 undangan diproses retensi (${report.retentionPurged})`,
  );
  check(
    (await cleanupMedia()).retentionPurged === 0,
    "cron dijalankan ulang: tidak memproses undangan yang sama lagi",
  );
  const after = await db.invitation.findUnique({ where: { id: purge.id } });
  const json = JSON.stringify(after?.data);
  check(!!after?.mediaPurgedAt, "mediaPurgedAt tercatat");
  check(
    after?.lastEditedAt.getTime() === purgeEditedBefore.getTime(),
    "cron TIDAK mengubah lastEditedAt",
  );
  check(
    !fs.existsSync(path.join(UPLOADS, purgeKey)),
    "file foto draf yang tidak diubah > 90 hari terhapus",
  );
  check(
    !json.includes(purgeKey) && json.includes("contoh.luar") && json.includes("Retno"),
    "URL file dikosongkan dari data; teks & link luar tetap",
  );
  check(
    fs.existsSync(path.join(UPLOADS, warnKey)),
    "draf 84 hari (masih 6 hari lagi) belum dihapus",
  );
  check(fs.existsSync(path.join(UPLOADS, freshKey)), "draf 30 hari tidak tersentuh");
  check(
    fs.existsSync(path.join(UPLOADS, paidKey)),
    "undangan yang sudah dibeli (400 hari) tidak terkena retensi",
  );

  await page.reload({ waitUntil: "networkidle0" });
  const t2 = (await page.evaluate("document.body.innerText")) as string;
  check(t2.includes("dihapus otomatis pada"), "dashboard memberi tahu media sudah dihapus");
  if (shots)
    await page.screenshot({
      path: `${shots}/dashboard-setelah-retensi.png` as `${string}.png`,
      fullPage: true,
    });

  console.log("Simpan di editor memulai ulang hitungan");
  const before = (await db.invitation.findUniqueOrThrow({ where: { id: warn.id } })).lastEditedAt;
  await page.goto(`${base}/dashboard/undangan/${warn.id}/edit`, { waitUntil: "networkidle0" });
  await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Mempelai"))?.click()`,
  );
  await page.waitForSelector("#f-bride-nickname", { timeout: 10000 });
  await page.click("#f-bride-nickname", { count: 3 });
  await page.type("#f-bride-nickname", "Retna");
  await page
    .waitForFunction(
      `document.querySelector('[role="status"]')?.textContent.includes("Tersimpan")`,
      { timeout: 15000 },
    )
    .catch(() => undefined);
  await new Promise((r) => setTimeout(r, 1500));
  const afterEdit = (await db.invitation.findUniqueOrThrow({ where: { id: warn.id } }))
    .lastEditedAt;
  check(
    afterEdit.getTime() > before.getTime() && Date.now() - afterEdit.getTime() < 60_000,
    "lastEditedAt diperbarui saat pengguna menyimpan",
  );
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  const t3 = (await page.evaluate("document.body.innerText")) as string;
  check(!/6 hari lagi/.test(t3), "peringatan hilang setelah draf diubah");
  await browser.close();

  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
