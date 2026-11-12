/**
 * Uji end-to-end dashboard & wizard (development) di browser sungguhan.
 *
 *   pnpm dev   (atau build + start)
 *   pnpm e2e:dashboard [base-url] [--shots=.reference/report/3a]
 *
 * Membuat 2 user uji (e2e-a@test.local, e2e-b@test.local) + cookie sesi
 * Auth.js (JWT, ditandatangani AUTH_SECRET dari .env), lalu menguji:
 *  - tanpa login → diarahkan ke /masuk
 *  - wizard: validasi bahasa Indonesia, buat undangan → editor, slug unik
 *  - pratinjau menampilkan data user (tanpa data contoh)
 *  - user B TIDAK bisa membuka pratinjau/editor undangan milik user A (404)
 * Data uji dihapus di awal tiap run. JANGAN dijalankan ke database produksi.
 */
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Page } from "puppeteer-core";

import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const COOKIE = base.startsWith("https") ? "__Secure-authjs.session-token" : "authjs.session-token";

let failed = 0;
function check(ok: boolean, label: string) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
}

async function userWithCookie(email: string, name: string) {
  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
  await db.invitation.deleteMany({ where: { userId: user.id } });
  const token = await encode({
    token: { sub: user.id, id: user.id, name, email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });
  return { user, token };
}

async function newPage(token?: string): Promise<Page> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 900 });
  if (token) {
    const url = new URL(base);
    await page.setCookie({
      name: COOKIE,
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
    });
  }
  return page;
}

const shot = async (page: Page, name: string, fullPage = false) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` as `${string}.png`, fullPage });
};

/** Isi input React terkontrol (termasuk type=date) lewat setter native + event input. */
async function fill(page: Page, id: string, value: string) {
  await page.evaluate(
    `(() => {
      const el = document.getElementById(${JSON.stringify(id)});
      const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    })()`,
  );
}
const clickText = (page: Page, text: string) =>
  page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(text)}))?.click()`,
  );
const bodyText = (page: Page) => page.evaluate("document.body.innerText") as Promise<string>;

async function createViaWizard(page: Page, themeName: string) {
  await page.goto(`${base}/dashboard/undangan/baru`, { waitUntil: "networkidle0" });
  await clickText(page, "Pernikahan");
  await sleep(300);
  await fill(page, "brideName", "Larasati Wulandari");
  await fill(page, "brideNickname", "Laras");
  await fill(page, "groomName", "Bima Prasetya");
  await fill(page, "groomNickname", "Bima");
  await fill(page, "date", new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
  await fill(page, "city", "Yogyakarta");
  await clickText(page, "Lanjut pilih tema");
  await sleep(400);
  await page.evaluate(
    `[...document.querySelectorAll('[role="radio"]')].find((b) => b.textContent.includes(${JSON.stringify(themeName)}))?.click()`,
  );
  await sleep(200);
  await clickText(page, "Buat undangan");
  await page.waitForFunction(`location.pathname.endsWith("/edit")`, { timeout: 30000 });
  return page.url().split("/undangan/")[1].split("/")[0];
}

async function main() {
  assertSafeDatabase("e2e-dashboard");
  const a = await userWithCookie("e2e-a@test.local", "Uji A");
  const b = await userWithCookie("e2e-b@test.local", "Uji B");

  console.log("Tanpa login");
  {
    const page = await newPage();
    await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
    check(new URL(page.url()).pathname === "/masuk", "/dashboard → /masuk");
    await page.browser().close();
  }

  console.log("Wizard (user A)");
  const page = await newPage(a.token);
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  check(
    (await bodyText(page)).includes("Belum ada undangan"),
    "dashboard kosong menampilkan ajakan",
  );
  await page.goto(`${base}/dashboard/undangan/baru`, { waitUntil: "networkidle0" });
  await shot(page, "wizard-1");
  await clickText(page, "Pernikahan");
  await sleep(300);
  await clickText(page, "Lanjut pilih tema");
  await sleep(300);
  const errs = await bodyText(page);
  check(
    errs.includes("Nama mempelai wanita wajib diisi") && errs.includes("Kota wajib diisi"),
    "validasi kosong → pesan bahasa Indonesia",
  );
  await shot(page, "wizard-2-validasi");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await shot(page, "wizard-2-mobile", true);
  await page.setViewport({ width: 1100, height: 900 });

  const id1 = await createViaWizard(page, "Renda Rimba");
  await shot(page, "wizard-3-dibuat");
  const inv1 = await db.invitation.findUnique({ where: { id: id1 } });
  check(!!inv1 && inv1.userId === a.user.id, "undangan tersimpan milik user A");
  check(inv1?.status === "DRAFT" && inv1.package === "FREE", "status DRAF, paket FREE");
  check(inv1?.slug === "laras-bima", `slug otomatis "${inv1?.slug}"`);
  check(!JSON.stringify(inv1?.data).includes("Sekar"), "tanpa data contoh");

  const id2 = await createViaWizard(page, "Tirai Beludru");
  const inv2 = await db.invitation.findUnique({ where: { id: id2 } });
  check(
    !!inv2 && inv2.slug !== "laras-bima" && inv2.slug.startsWith("laras-bima-"),
    `slug kedua unik "${inv2?.slug}"`,
  );

  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  const list = await bodyText(page);
  check(
    list.includes("Laras & Bima") && list.includes("Draf"),
    "dashboard menampilkan undangan + status",
  );
  await shot(page, "dashboard-daftar");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await shot(page, "dashboard-mobile", true);

  const prev = await page.goto(`${base}/dashboard/undangan/${id1}/pratinjau?to=Pak%20Budi`, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("[data-inv-ready]", { timeout: 30000 });
  await sleep(1500);
  const pv = await bodyText(page);
  check(
    prev?.status() === 200 && pv.includes("Laras") && pv.includes("Pak Budi"),
    "pratinjau pemilik: data sendiri + nama tamu",
  );
  await shot(page, "pratinjau-cover");
  await page.browser().close();

  console.log("Akses silang (user B → undangan user A)");
  const pb = await newPage(b.token);
  for (const path of ["pratinjau", "edit"]) {
    const res = await pb.goto(`${base}/dashboard/undangan/${id1}/${path}`, {
      waitUntil: "networkidle0",
    });
    check(res?.status() === 404, `/${path} undangan orang lain → 404 (status ${res?.status()})`);
  }
  const resBad = await pb.goto(`${base}/dashboard/undangan/tidak-ada/edit`, {
    waitUntil: "networkidle0",
  });
  check(resBad?.status() === 404, "id tidak dikenal → 404");
  await pb.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  check(!(await bodyText(pb)).includes("Laras & Bima"), "dashboard B tidak menampilkan undangan A");
  await pb.browser().close();

  const pub = await fetch(`${base}/u/${inv1?.slug}`);
  check(pub.status === 404, "draf belum bisa dibuka publik di /u/[slug]");

  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
