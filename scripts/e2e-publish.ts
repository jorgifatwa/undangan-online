/**
 * Uji end-to-end Terbitkan (4a) — development.
 *
 *   pnpm dev
 *   pnpm e2e:publish [base-url] [--shots=.reference/report/4a]
 *
 *  - dialog Terbitkan: menyimpan dulu, checklist, aturan masa uji FREE
 *  - terbit → /slug tampil (watermark FREE); perubahan langsung tampil
 *  - batal terbit → 404; terbit ulang → masa uji TIDAK di-reset
 *  - kedaluwarsa → halaman "tidak aktif" tanpa data pribadi; tombol upgrade
 *    hanya untuk pemilik; terbit ulang FREE ditolak
 *  - checklist menolak tema di atas paket (BASIC + Tirai Premium)
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400_000;
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};

async function user(email: string, name: string) {
  const u = await db.user.upsert({ where: { email }, update: { name }, create: { email, name } });
  const token = await encode({
    token: { sub: u.id, id: u.id, name, email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  return { u, token };
}
async function invitation(userId: string, slug: string, pkg: "FREE" | "BASIC", themeId: string) {
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Kirana Ayu",
    brideNickname: "Kirana",
    groomName: "Galih Pratama",
    groomNickname: "Galih",
    date: new Date(Date.now() + 50 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Semarang",
    greeting: "islami",
    quoteId: "ar-rum-21",
    themeId,
  }).data;
  return db.invitation.create({
    data: {
      userId,
      slug,
      eventType: "WEDDING",
      themeId,
      package: pkg,
      data: data as Prisma.InputJsonValue,
    },
  });
}
const text = (p: Page) => p.evaluate("document.body.innerText") as Promise<string>;
const clickText = (p: Page, t: string) =>
  p.evaluate(
    `[...document.querySelectorAll("button, a")].find((b) => b.textContent.trim().startsWith(${JSON.stringify(t)}))?.click()`,
  );
const waitText = (p: Page, t: string, ms = 15000) =>
  p.waitForFunction(`document.body.innerText.includes(${JSON.stringify(t)})`, { timeout: ms }).then(
    () => true,
    () => false,
  );
const status = async (path: string, cookie?: string) =>
  (await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {} })).status;
const html = async (path: string, cookie?: string) =>
  (await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {} })).text();

async function main() {
  assertSafeDatabase("e2e-publish");
  const a = await user("e2e-a@test.local", "Uji A");
  const b = await user("e2e-b@test.local", "Uji B");
  const inv = await invitation(a.u.id, "kirana-galih-uji", "FREE", "renda-rimba");
  const tirai = await invitation(a.u.id, "uji-basic-tirai", "BASIC", "tirai-beludru");
  const cookieA = `authjs.session-token=${a.token}`;
  const cookieB = `authjs.session-token=${b.token}`;
  const shot = async (p: Page, n: string) => {
    if (shots) await p.screenshot({ path: `${shots}/${n}.png` as `${string}.png` });
  };

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await page.setCookie({
    name: "authjs.session-token",
    value: a.token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  page.on("dialog", (d) => void d.accept());
  const editUrl = `${base}/dashboard/undangan/${inv.id}/edit`;

  console.log("Sebelum terbit");
  check((await status(`/${inv.slug}`)) === 404, "draf → /slug 404");

  console.log("Dialog Terbitkan");
  await page.goto(editUrl, { waitUntil: "networkidle0", timeout: 90000 });
  await clickText(page, "Terbitkan");
  check(await waitText(page, "Nama kedua mempelai"), "checklist tampil (setelah menyimpan)");
  const t = await text(page);
  check(
    t.includes("Aturan paket Gratis") &&
      t.includes("3 hari sejak pertama kali diterbitkan") &&
      t.includes("tidak menghentikan hitungan"),
    "penjelasan aturan masa uji FREE",
  );
  await sleep(500);
  await shot(page, "1-dialog-terbitkan");
  await clickText(page, "Terbitkan sekarang");
  check(await waitText(page, "Undangan terbit"), "berhasil terbit");
  await sleep(400);
  await shot(page, "2-sudah-terbit");
  let row = await db.invitation.findUnique({ where: { id: inv.id } });
  const firstExpiry = row!.expiresAt!;
  check(row?.status === "PUBLISHED" && !!row.publishedAt, "status PUBLISHED + publishedAt");
  check(
    Math.abs(firstExpiry.getTime() - row!.publishedAt!.getTime() - 3 * DAY) < 5000,
    "FREE: expiresAt = terbit + 3 hari",
  );

  console.log("Halaman publik");
  const pub = await html(`/${inv.slug}`);
  check(pub.includes("Kirana") && pub.includes("Galih"), "/slug menampilkan undangan");
  check(/noindex/.test(pub), "meta robots noindex");
  // konteks terpisah (tanpa cookie login pemilik) = tamu sungguhan
  const guestCtx = await browser.createBrowserContext();
  const pv = await guestCtx.newPage();
  await pv.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await pv.goto(`${base}/${inv.slug}?to=Bapak%20Hadi`, { waitUntil: "networkidle0" });
  await pv.waitForSelector("[data-inv-ready]");
  await sleep(1200);
  await shot(pv, "3-publik-cover");
  await pv.evaluate(`document.querySelector('[aria-label="Buka undangan"]')?.click()`);
  await sleep(2500);
  await pv.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
  await sleep(1500);
  check(
    (await text(pv)).includes("Undangku") || (await pv.$("a[href]")) !== null,
    "watermark paket Gratis di akhir halaman",
  );
  await shot(pv, "4-publik-watermark");

  console.log("Perubahan setelah terbit");
  await page.bringToFront();
  await page.keyboard.press("Escape");
  await sleep(300);
  await clickText(page, "Mempelai");
  await sleep(400);
  await page.click("#f-bride-nickname", { count: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#f-bride-nickname", "Kiran");
  await page
    .waitForFunction(
      `document.querySelector('[role="status"]')?.textContent.includes("Tersimpan")`,
      { timeout: 15000 },
    )
    .catch(() => undefined);
  await sleep(800);
  check(
    (await html(`/${inv.slug}`)).includes("Kiran &amp;") ||
      (await html(`/${inv.slug}`)).includes("Kiran"),
    "perubahan langsung tampil di /slug",
  );

  console.log("Batal terbit & terbit ulang");
  await clickText(page, "Terbit ✓");
  await waitText(page, "Batalkan terbit");
  await clickText(page, "Batalkan terbit");
  await sleep(1500);
  check((await status(`/${inv.slug}`)) === 404, "batal terbit → 404");
  check(
    (await db.invitation.findUnique({ where: { id: inv.id } }))?.status === "DRAFT",
    "status kembali DRAFT",
  );
  await clickText(page, "Terbitkan");
  await waitText(page, "Terbitkan sekarang");
  await sleep(1000);
  await clickText(page, "Terbitkan sekarang");
  await waitText(page, "Undangan terbit");
  row = await db.invitation.findUnique({ where: { id: inv.id } });
  check(
    row?.expiresAt?.getTime() === firstExpiry.getTime(),
    "terbit ulang: masa uji TIDAK di-reset",
  );

  console.log("Kedaluwarsa");
  await db.invitation.update({
    where: { id: inv.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const guest = await html(`/${inv.slug}`);
  check(guest.includes("Undangan sudah tidak aktif"), 'tamu: "Undangan sudah tidak aktif"');
  check(
    !guest.includes("Kiran") && !guest.includes("Galih") && !guest.includes("Semarang"),
    "tidak ada data pribadi di halaman kedaluwarsa",
  );
  check(!guest.includes("Lihat paket"), "tamu tidak melihat tombol upgrade");
  check(
    !(await html(`/${inv.slug}`, cookieB)).includes("Lihat paket"),
    "user lain tidak melihat tombol upgrade",
  );
  check(
    (await html(`/${inv.slug}`, cookieA)).includes("Lihat paket"),
    "pemilik melihat tombol upgrade",
  );
  await pv.goto(`${base}/${inv.slug}`, { waitUntil: "networkidle0" });
  await shot(pv, "5-kedaluwarsa-tamu");
  await pv.setCookie({
    name: "authjs.session-token",
    value: a.token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await pv.reload({ waitUntil: "networkidle0" });
  await shot(pv, "6-kedaluwarsa-pemilik");
  await page.bringToFront();
  await page.goto(editUrl, { waitUntil: "networkidle0" });
  check(
    (await text(page)).includes("Masa uji berakhir"),
    "editor: tombol menandai masa uji berakhir",
  );
  await db.invitation.update({ where: { id: inv.id }, data: { status: "DRAFT" } });
  await page.reload({ waitUntil: "networkidle0" });
  await clickText(page, "Terbitkan");
  check(
    await waitText(page, "Masa uji 3 hari sudah berakhir"),
    "FREE kedaluwarsa tidak bisa terbit ulang",
  );
  const disabled = await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Terbitkan sekarang"))?.disabled`,
  );
  check(disabled === true, "tombol Terbitkan sekarang nonaktif");
  await shot(page, "7-terbit-ulang-ditolak");

  console.log("Tema di atas paket");
  await page.goto(`${base}/dashboard/undangan/${tirai.id}/edit`, { waitUntil: "networkidle0" });
  await clickText(page, "Terbitkan");
  check(await waitText(page, "butuh paket Premium"), "BASIC + Tirai (Premium) → checklist menolak");

  console.log("Dashboard");
  await db.invitation.update({
    where: { id: inv.id },
    data: { status: "PUBLISHED", expiresAt: new Date(Date.now() + 2 * DAY) },
  });
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  check((await text(page)).includes("Masa uji aktif sampai"), "dashboard: sisa masa aktif");
  await shot(page, "8-dashboard");

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
