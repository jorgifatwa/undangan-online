/**
 * Uji end-to-end Terbitkan (4a) — development.
 *
 *   pnpm dev
 *   pnpm e2e:publish [base-url] [--shots=.reference/report/4a]
 *
 *  - draf belum dibeli: checklist menolak terbit + tombol "Beli tema"; server
 *    juga menolak (bukan hanya UI)
 *  - setelah tema dibeli: terbit → /slug tampil TANPA watermark; perubahan
 *    langsung tampil; batal terbit → 404; terbit ulang bisa
 *  - DITANGGUHKAN admin (pnpm admin:suspend): /slug, /slug/og, API RSVP 404;
 *    pemilik melihat "Ditangguhkan" + alasan; tidak bisa terbit ulang;
 *    admin:unsuspend memulihkan; AdminAudit tercatat
 *  - harga per tema: undangan yang sudah membeli Renda tidak bisa pindah ke Tirai
 *    (lebih mahal) tanpa bayar selisih — editor hanya pratinjau, server menolak
 */
import { execFileSync } from "node:child_process";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";
import { planFields, purchased } from "./lib/purchase";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
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
async function invitation(userId: string, slug: string, plan: "draft" | "paid", themeId: string) {
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
      ...planFields(plan, themeId),
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

const admin = (cmd: "suspend" | "unsuspend", slug: string, extra: string[]) =>
  execFileSync("pnpm", ["-s", `admin:${cmd}`, slug, "--by=Uji E2E", ...extra], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

async function main() {
  assertSafeDatabase("e2e-publish");
  const a = await user("e2e-a@test.local", "Uji A");
  const inv = await invitation(a.u.id, "kirana-galih-uji", "draft", "renda-rimba");
  const tirai = await invitation(a.u.id, "uji-basic-tirai", "paid", "renda-rimba");
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

  console.log("Draf belum dibeli");
  check((await status(`/${inv.slug}`)) === 404, "draf → /slug 404");
  await page.goto(editUrl, { waitUntil: "networkidle0", timeout: 90000 });
  await clickText(page, "Terbitkan");
  check(await waitText(page, "Tema sudah dibeli"), "checklist tampil (setelah menyimpan)");
  let t = await text(page);
  check(
    t.includes("Undangan bisa diterbitkan setelah tema Renda Rimba dibeli") &&
      t.includes("Draf tetap bisa diisi & dipratinjau gratis"),
    "checklist menolak: tema belum dibeli",
  );
  check(!/masa uji|uji coba|3 hari/i.test(t), "tidak ada teks masa uji di dialog");
  const disabledBuy = await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Terbitkan sekarang"))?.disabled`,
  );
  check(disabledBuy === true, "tombol Terbitkan sekarang nonaktif");
  await clickText(page, "Beli tema");
  check(
    await waitText(page, "Pembayaran online segera hadir"),
    "tombol Beli tema → info pembayaran",
  );
  await sleep(300);
  await shot(page, "1-dialog-belum-dibeli");
  // Server menolak walau UI dilewati: panggil langsung lewat lib publish
  const { publishInvitation } = await import("../src/lib/invitations/publish");
  const serverErr = await publishInvitation(a.u.id, inv.id).then(
    () => null,
    (e: Error) => e.message,
  );
  check(!!serverErr && serverErr.includes("setelah tema"), "server menolak terbit tanpa beli");
  check(
    (await db.invitation.findUnique({ where: { id: inv.id } }))?.status === "DRAFT",
    "status tetap DRAFT",
  );

  console.log("Setelah tema dibeli");
  await db.invitation.update({ where: { id: inv.id }, data: purchased("renda-rimba") });
  await page.keyboard.press("Escape");
  await page.goto(editUrl, { waitUntil: "networkidle0" });
  await clickText(page, "Terbitkan");
  check(await waitText(page, "Terbitkan sekarang"), "dialog terbuka");
  await sleep(1000);
  await clickText(page, "Terbitkan sekarang");
  check(await waitText(page, "Undangan terbit"), "berhasil terbit");
  t = await text(page);
  check(t.includes("Aktif minimal 12 bulan setelah tanggal acara"), "info masa aktif 12 bulan");
  await sleep(400);
  await shot(page, "2-sudah-terbit");
  let row = await db.invitation.findUnique({ where: { id: inv.id } });
  const firstPublished = row!.publishedAt!;
  check(row?.status === "PUBLISHED" && !!row.publishedAt, "status PUBLISHED + publishedAt");

  console.log("Halaman publik");
  const pub = await html(`/${inv.slug}`);
  check(pub.includes("Kirana") && pub.includes("Galih"), "/slug menampilkan undangan");
  check(/noindex/.test(pub), "meta robots noindex");
  check(!pub.includes("data-watermark") && !/Dibuat dengan/i.test(pub), "tanpa watermark");
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
  check((await html(`/${inv.slug}`)).includes("Kiran"), "perubahan langsung tampil di /slug");

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
    row?.status === "PUBLISHED" && row.publishedAt?.getTime() === firstPublished.getTime(),
    "terbit ulang berhasil; publishedAt pertama tetap",
  );
  check((await status(`/${inv.slug}`)) === 200, "/slug kembali 200");

  console.log("Ditangguhkan admin");
  const before = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  const out = admin("suspend", inv.slug, ["--reason=Laporan penipuan rekening amplop"]);
  check(out.includes("DITANGGUHKAN"), "pnpm admin:suspend berhasil");
  const after = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  check(
    !!after.suspendedAt && after.suspendReason === "Laporan penipuan rekening amplop",
    "suspendedAt + alasan tersimpan",
  );
  check(
    after.lastEditedAt.getTime() === before.lastEditedAt.getTime() &&
      after.updatedAt.getTime() === before.updatedAt.getTime(),
    "admin tidak mengubah lastEditedAt/updatedAt",
  );
  check((await status(`/${inv.slug}`)) === 404, "tamu: /slug 404");
  const sus = await html(`/${inv.slug}`);
  check(!sus.includes("Kiran") && !sus.includes("Semarang"), "404 tanpa data pribadi");
  check((await status(`/${inv.slug}/og`)) === 404, "/slug/og 404");
  const rsvp = await fetch(`${base}/api/u/${inv.slug}/guestbook`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ name: "Tamu", attendance: "HADIR", guests: 1, message: "Selamat" }),
  });
  check(rsvp.status === 404, `API RSVP/ucapan 404 (dapat ${rsvp.status})`);
  check((await status(`/api/u/${inv.slug}/wishes`)) === 404, "API daftar ucapan 404");
  check(
    (await status(`/${inv.slug}`, `authjs.session-token=${a.token}`)) === 404,
    "pemilik pun 404 di /slug",
  );
  await page.goto(editUrl, { waitUntil: "networkidle0" });
  t = await text(page);
  check(
    t.includes("Undangan ini ditangguhkan") && t.includes("Laporan penipuan rekening amplop"),
    "editor: Ditangguhkan + alasan",
  );
  check(t.includes("Ajukan banding"), "editor: kontak banding");
  await shot(page, "4-editor-ditangguhkan");
  await clickText(page, "Ditangguhkan");
  check(await waitText(page, "Undangan tidak ditangguhkan"), "checklist: ditangguhkan");
  const disabledSus = await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Terbitkan sekarang"))?.disabled`,
  );
  check(disabledSus === true, "tidak bisa terbit ulang (UI)");
  await db.invitation.update({
    where: { id: inv.id },
    data: { status: "DRAFT", updatedAt: after.updatedAt },
  });
  const serverSus = await publishInvitation(a.u.id, inv.id).then(
    () => null,
    (e: Error) => e.message,
  );
  check(!!serverSus && serverSus.includes("ditangguhkan"), "server menolak terbit ulang");
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  t = await text(page);
  check(
    t.includes("Ditangguhkan") && t.includes("Laporan penipuan rekening amplop"),
    "dashboard: Ditangguhkan + alasan",
  );
  await shot(page, "5-dashboard-ditangguhkan");
  const out2 = admin("unsuspend", inv.slug, ["--note=Banding diterima"]);
  check(out2.includes("dipulihkan"), "pnpm admin:unsuspend berhasil");
  await db.invitation.update({ where: { id: inv.id }, data: { status: "PUBLISHED" } });
  check((await status(`/${inv.slug}`)) === 200, "setelah dipulihkan: /slug 200");
  const audits = await db.adminAudit.findMany({
    where: { invitationId: inv.id, action: { in: ["suspend", "unsuspend"] } },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  check(
    audits.length === 2 && audits.every((x) => x.actor.startsWith("Uji E2E (os:")),
    "AdminAudit mencatat suspend & unsuspend",
  );
  let refused = false;
  try {
    execFileSync("pnpm", ["-s", "admin:suspend", inv.slug, "--by=Uji", "--reason=Uji produksi"], {
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "pipe",
    });
  } catch (e) {
    refused = (e as { status?: number }).status === 2;
  }
  check(refused, "admin:suspend ditolak di production tanpa ALLOW_ADMIN_SUSPEND=1");
  check(
    !(await db.invitation.findUniqueOrThrow({ where: { id: inv.id } })).suspendedAt,
    "penolakan production tidak mengubah data",
  );

  console.log("Harga per tema: pindah ke tema lebih mahal setelah membeli");
  // `tirai` = undangan yang SUDAH membeli Renda Rimba (Rp99.000)
  await page.goto(`${base}/dashboard/undangan/${tirai.id}/edit`, { waitUntil: "networkidle0" });
  // grup tema terbuka secara bawaan; klik hanya bila tertutup
  if (!(await page.$('[data-theme-option="renda-rimba"]')))
    await clickText(page, "Tema, warna & alamat");
  await page.waitForSelector('[data-theme-option="renda-rimba"]', { timeout: 10000 });
  const opt = (id: string) =>
    page.$eval(`[data-theme-option="${id}"]`, (e) => (e as HTMLElement).innerText);
  check((await opt("renda-rimba")).includes("Dimiliki"), "tema yang dibeli: “Dimiliki”");
  check(
    (await opt("tirai-beludru")).includes("Bayar selisih Rp50.000"),
    "Tirai (Rp149.000): bayar selisih Rp50.000",
  );
  check(
    (await opt("confetti-party").catch(() => "")) === "" ||
      (await opt("confetti-party")).includes("Gratis"),
    "tema lebih murah: gratis (atau tidak tersedia untuk jenis acara ini)",
  );
  await page.click('[data-theme-option="tirai-beludru"] button');
  check(await waitText(page, "Sedang mempratinjau"), "klik tema lebih mahal → hanya pratinjau");
  await sleep(2500); // lewati jeda simpan otomatis
  check(
    (await db.invitation.findUnique({ where: { id: tirai.id } }))?.themeId === "renda-rimba",
    "tema tersimpan tetap Renda Rimba (belum bayar selisih)",
  );
  check(
    (await text(page)).includes("Pembayaran online segera hadir"),
    "bayar selisih: segera hadir",
  );
  await shot(page, "6-ganti-tema-bayar-selisih");

  console.log("Dashboard");
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  t = await text(page);
  check(
    t.includes("Tema sudah dibeli") && t.includes("Terbit"),
    "dashboard: sudah dibeli & terbit",
  );
  check(!/masa uji|uji coba/i.test(t), "dashboard tanpa teks masa uji");
  await shot(page, "7-dashboard");

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
