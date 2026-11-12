/**
 * Uji kuota penyimpanan PER UNDANGAN & retensi media FREE (development).
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
  pkg: "FREE" | "BASIC",
  expiresAt: Date | null,
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
      package: pkg,
      status: expiresAt ? "PUBLISHED" : "DRAFT",
      publishedAt: expiresAt ? new Date(expiresAt.getTime() - 3 * DAY) : null,
      expiresAt,
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
  const free = await invitation(u.id, "uji-kuota-free", "FREE", null);
  const basic = await invitation(u.id, "uji-kuota-basic", "BASIC", null);
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
    "undangan FREE penuh (50 MB) → ditolak dengan kode QUOTA",
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
  check(basicOk, "undangan BASIC milik akun yang sama tetap bisa upload (kuota terpisah)");
  await db.media.deleteMany({ where: { userId: u.id } });
  await db.invitation.deleteMany({ where: { userId: u.id } });

  console.log("Retensi media FREE");
  const now = Date.now();
  const warn = await invitation(u.id, "uji-retensi-peringatan", "FREE", new Date(now - 24 * DAY)); // dihapus 6 hari lagi
  const purge = await invitation(u.id, "uji-retensi-hapus", "FREE", new Date(now - 31 * DAY));
  const paid = await invitation(u.id, "uji-retensi-basic", "BASIC", new Date(now - 60 * DAY));
  const warnKey = await attachPhoto(u.id, warn.id);
  const purgeKey = await attachPhoto(u.id, purge.id);
  const paidKey = await attachPhoto(u.id, paid.id);

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
  check(t1.includes("Tingkatkan paket"), "peringatan menawarkan upgrade");
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
  const after = await db.invitation.findUnique({ where: { id: purge.id } });
  const json = JSON.stringify(after?.data);
  check(!!after?.mediaPurgedAt, "mediaPurgedAt tercatat");
  check(
    !fs.existsSync(path.join(UPLOADS, purgeKey)),
    "file foto undangan kedaluwarsa > 30 hari terhapus",
  );
  check(
    !json.includes(purgeKey) && json.includes("contoh.luar") && json.includes("Retno"),
    "URL file dikosongkan dari data; teks & link luar tetap",
  );
  check(
    fs.existsSync(path.join(UPLOADS, warnKey)),
    "undangan yang baru 24 hari kedaluwarsa belum dihapus",
  );
  check(fs.existsSync(path.join(UPLOADS, paidKey)), "undangan berbayar tidak terkena retensi");

  await page.reload({ waitUntil: "networkidle0" });
  const t2 = (await page.evaluate("document.body.innerText")) as string;
  check(t2.includes("dihapus otomatis pada"), "dashboard memberi tahu media sudah dihapus");
  if (shots)
    await page.screenshot({
      path: `${shots}/dashboard-setelah-retensi.png` as `${string}.png`,
      fullPage: true,
    });
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
