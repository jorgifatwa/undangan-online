/**
 * Uji end-to-end ALUR MARKETPLACE (link khusus) di browser sungguhan:
 *
 *   pnpm dev
 *   pnpm e2e:claim-flow [base-url] [--shots=.reference/report/link-khusus]
 *
 *  1. admin membuat link khusus di /dashboard/link-khusus → pesan WA berisi link
 *  2. pembeli membuka link → sambutan → "Mulai isi" (sesi CUSTOMER) → editor bertahap
 *  3. "Simpan & lanjut" menyimpan data + posisi langkah; buka ulang → lanjut dari langkah itu
 *  4. server menolak ganti tema berbeda harga & menerima harga sama
 *  5. langkah Konfirmasi: cek alamat (dipakai/cadangan/tersedia) → modal → tayang
 *  6. undangan tayang di /{alamat}; tema terkunci; /akun (tamu massal, link ?to=, WA)
 *  7. admin membuat akun login → pembeli login email/kata sandi → /akun
 *  8. keamanan: pembeli tidak bisa membuka /dashboard, undangan orang lain, atau
 *     menulis ke undangan admin; link dicabut/kedaluwarsa → ditolak
 * Hanya ke database lokal (assertSafeDatabase); data uji dibersihkan di akhir.
 */
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Browser, BrowserContext, Page } from "puppeteer-core";

import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const COOKIE = base.startsWith("https") ? "__Secure-authjs.session-token" : "authjs.session-token";
const ADMIN_EMAIL = "admin-linkkhusus@test.local";
const BUYER_EMAIL = "pembeli-linkkhusus@example.com";
const SLUG = "e2e-laras-bima";

let failed = 0;
function check(ok: unknown, label: string) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function shot(page: Page, name: string) {
  if (!shots) return;
  const fs = await import("node:fs");
  fs.mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
}

async function adminContext(browser: Browser) {
  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: "Admin Uji", role: "ADMIN" },
    update: {},
  });
  const ctx = await browser.createBrowserContext();
  const token = await encode({
    token: { sub: admin.id, id: admin.id, name: admin.name, email: ADMIN_EMAIL, role: "ADMIN" },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });
  await ctx.setCookie({
    name: COOKIE,
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  return { admin, ctx };
}

async function clickText(page: Page, selector: string, text: string) {
  const ok = await page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll<HTMLElement>(sel)].find((e) =>
        e.textContent?.includes(t),
      );
      el?.click();
      return !!el;
    },
    selector,
    text,
  );
  if (!ok) throw new Error(`Tidak menemukan ${selector} "${text}"`);
}

/** Kosongkan input (terkontrol React) lalu ketik nilai baru. */
async function fill(
  page: Page,
  el: import("puppeteer-core").ElementHandle<Element>,
  value: string,
) {
  await el.evaluate((e) => (e as HTMLInputElement).select());
  await page.keyboard.press("Backspace");
  await el.type(value);
}

const bodyText = (page: Page) => page.evaluate(() => document.body.innerText);

async function waitText(page: Page, text: string, timeout = 15000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
}

async function main() {
  assertSafeDatabase("e2e-claim-flow");
  await db.invitation.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: BUYER_EMAIL } });

  const browser = await launchBrowser();
  const createdInvitations: string[] = [];
  let ctxA: BrowserContext | null = null;
  try {
    // ── 1. admin membuat link ──────────────────────────────────────────────
    console.log("1. Admin membuat link khusus");
    const { ctx } = await adminContext(browser);
    ctxA = ctx;
    const admin = await ctx.newPage();
    await admin.setViewport({ width: 1280, height: 900 });
    await admin.goto(`${base}/dashboard/link-khusus`, { waitUntil: "networkidle0" });
    check((await bodyText(admin)).includes("Buat link baru"), "halaman link khusus admin tampil");
    await admin.select("#themeId", "lili");
    await admin.type("#customerName", "Larasati Uji");
    await admin.type("#customerPhone", "0812 3456 7890");
    await admin.type("#marketplaceOrder", "SHP-E2E-1");
    await clickText(admin, "button", "Buat link khusus");
    await admin.waitForSelector("textarea[readonly]", { timeout: 15000 });
    const msg = await admin.$eval("textarea[readonly]", (t) => (t as HTMLTextAreaElement).value);
    const url = /https?:\/\/\S+\/isi\/[A-Za-z0-9_-]{43}/.exec(msg)?.[0];
    check(!!url, "pesan berisi link /isi/{token}");
    check(msg.includes("Larasati Uji") && msg.includes("Lili"), "pesan menyebut nama & tema");
    const waHref = await admin.$eval("a[href*='wa.me']", (a) => (a as HTMLAnchorElement).href);
    check(waHref.includes("wa.me/6281234567890"), "tombol WhatsApp ke nomor pembeli (62…)");
    await shot(admin, "01-admin-link");
    const claim = await db.claimLink.findFirstOrThrow({
      where: { marketplaceOrder: "SHP-E2E-1" },
      include: { invitation: true },
    });
    createdInvitations.push(claim.invitationId);
    check(claim.status === "OPEN" && claim.customerPhone === "6281234567890", "claim OPEN di DB");
    const claimPath = new URL(url!).pathname;

    // ── 2. pembeli membuka link ───────────────────────────────────────────
    console.log("2. Pembeli membuka link");
    const ctxB = await browser.createBrowserContext();
    const buyer = await ctxB.newPage();
    await buyer.setViewport({ width: 1280, height: 900 });
    const res = await buyer.goto(`${base}${claimPath}`, { waitUntil: "networkidle0" });
    check(
      res?.headers()["x-robots-tag"]?.includes("noindex") &&
        res?.headers()["referrer-policy"] === "no-referrer",
      "link khusus: noindex + no-referrer",
    );
    check((await bodyText(buyer)).includes("Halo, Larasati Uji"), "halaman sambutan");
    await shot(buyer, "02-sambutan");
    // sebelum klik: belum ada sesi
    check(
      !(await ctxB.cookies()).some((c) => c.name === COOKIE),
      "membuka link (GET) tidak membuat sesi",
    );
    await Promise.all([
      buyer.waitForNavigation({ waitUntil: "networkidle0" }),
      clickText(buyer, "button", "Mulai isi undangan"),
    ]);
    await waitText(buyer, "Langkah 1/");
    check(true, "editor bertahap tampil (Langkah 1/N)");
    const steps = await buyer.$$eval("ol[aria-label='Langkah pengisian'] button", (b) =>
      b.map((x) => x.textContent ?? ""),
    );
    check(
      steps.at(-1)?.includes("Konfirmasi"),
      `langkah terakhir Konfirmasi (${steps.length} langkah)`,
    );
    check(!(await bodyText(buyer)).includes("Terbitkan"), "tombol admin (Terbitkan) tidak tampil");
    check(!steps.some((s) => s.includes("RSVP")), "grup RSVP/ucapan tidak ada di form pembeli");
    // pratinjau iframe memakai rute pembeli
    const iframeSrc = await buyer.$eval("iframe", (f) => (f as HTMLIFrameElement).src);
    check(iframeSrc.includes("/akun/undangan/"), "pratinjau memakai rute /akun");
    await buyer.waitForFunction(
      () => {
        const f = document.querySelector("iframe") as HTMLIFrameElement | null;
        return !!f?.contentDocument?.body?.innerText?.length;
      },
      { timeout: 30000 },
    );
    check(true, "pratinjau termuat");
    await shot(buyer, "03-langkah-1");

    // ── 3. isi nama di langkah Mempelai, simpan & lanjut ───────────────────
    console.log("3. Isi bertahap + simpan tiap langkah");
    const profilIdx = steps.findIndex((s) => s.includes("Mempelai"));
    for (let i = 0; i < profilIdx; i++) {
      await clickText(buyer, "button", "Simpan & lanjut");
      await waitText(buyer, `Langkah ${i + 2}/`);
    }
    const nameInputs = await buyer.$$("input[name$='fullName']");
    check(nameInputs.length >= 2, "langkah Mempelai berisi isian nama");
    await fill(buyer, nameInputs[0], "Larasati Wulandari");
    await fill(buyer, nameInputs[1], "Bima Prasetya");
    for (const [sel, v] of [
      ["input[name='bride.nickname']", "Laras"],
      ["input[name='groom.nickname']", "Bima"],
    ] as const) {
      const el = await buyer.$(sel);
      if (el) await fill(buyer, el, v);
    }
    await clickText(buyer, "button", "Simpan & lanjut");
    await waitText(buyer, `Langkah ${profilIdx + 2}/`);
    await sleep(500);
    const afterStep = await db.claimLink.findUniqueOrThrow({
      where: { id: claim.id },
      include: { invitation: true },
    });
    const data = afterStep.invitation.data as { bride: { fullName: string } };
    check(
      data.bride.fullName === "Larasati Wulandari",
      "pindah langkah → data tersimpan di server",
    );
    check(afterStep.step === profilIdx + 1, `posisi langkah tersimpan (${afterStep.step})`);
    // muat ulang → lanjut di langkah yang sama
    await buyer.reload({ waitUntil: "networkidle0" });
    await waitText(buyer, `Langkah ${profilIdx + 2}/`);
    check(true, "dibuka ulang → lanjut dari langkah terakhir");

    // ── 4. aturan ganti tema (server) ──────────────────────────────────────
    console.log("4. Aturan ganti tema");
    const { THEME_MANIFESTS } = await import("../src/themes/registry");
    const lili = THEME_MANIFESTS.find((m) => m.id === "lili")!;
    const same = THEME_MANIFESTS.find(
      (m) => m.id !== "lili" && m.price === lili.price && m.eventTypes.includes("WEDDING"),
    );
    const diff = THEME_MANIFESTS.find(
      (m) => m.price !== lili.price && m.eventTypes.includes("WEDDING"),
    );
    const pickerIds = await (async () => {
      await clickText(buyer, "ol[aria-label='Langkah pengisian'] button", "Tema");
      await waitText(buyer, "Langkah 1/");
      return buyer.$$eval("[data-theme-id]", (els) =>
        els.map((e) => e.getAttribute("data-theme-id")),
      );
    })();
    if (pickerIds.length)
      check(
        pickerIds.every((id) => THEME_MANIFESTS.find((m) => m.id === id)?.price === lili.price),
        `pilihan tema hanya berharga sama (${pickerIds.length})`,
      );
    const { customerEditError } = await import("../src/lib/claims/guard");
    const inv0 = afterStep.invitation;
    if (diff)
      check(
        (await customerEditError("CUSTOMER", inv0, diff.id)) !== null,
        `server menolak tema beda harga (${diff.name})`,
      );
    if (same)
      check(
        (await customerEditError("CUSTOMER", inv0, same.id)) === null,
        `server menerima tema harga sama (${same.name})`,
      );
    check((await customerEditError("ADMIN", inv0, diff?.id)) === null, "admin tidak dibatasi");

    // ── 5. konfirmasi ─────────────────────────────────────────────────────
    console.log("5. Konfirmasi & tayang");
    await clickText(buyer, "ol[aria-label='Langkah pengisian'] button", "Konfirmasi");
    await buyer.waitForSelector("#claim-slug", { timeout: 15000 });
    await shot(buyer, "04-konfirmasi");
    const typeSlug = async (v: string) => {
      await fill(buyer, (await buyer.$("#claim-slug"))!, v);
      await sleep(1200);
      return buyer.$eval("#claim-slug ~ p, [role=status]", () =>
        [...document.querySelectorAll("[role=status]")].map((e) => e.textContent).join(" | "),
      );
    };
    check((await typeSlug("dashboard")).includes("dicadangkan"), "alamat cadangan sistem ditolak");
    check((await typeSlug("draf-abc")).includes("draf-"), "alamat draf- ditolak");
    const other = await db.invitation.findFirst({
      where: { status: "PUBLISHED", NOT: { id: claim.invitationId } },
      select: { slug: true },
    });
    if (other) {
      const m = await typeSlug(other.slug);
      check(m.includes("sudah dipakai"), `alamat terpakai ditolak (${other.slug}: ${m})`);
    }
    check((await typeSlug(SLUG)).includes("tersedia"), "alamat baru tersedia");
    await clickText(buyer, "button", "Konfirmasi undangan");
    await buyer.waitForSelector("[role=dialog]");
    check(
      (await bodyText(buyer)).includes("Tema terkunci"),
      "modal konfirmasi menjelaskan tema terkunci",
    );
    await shot(buyer, "05-modal");
    await clickText(buyer, "[role=dialog] button", "Ya, tayangkan");
    await waitText(buyer, "Undangan sudah tayang", 20000);
    await shot(buyer, "06-tayang");
    const done = await db.claimLink.findUniqueOrThrow({
      where: { id: claim.id },
      include: { invitation: true },
    });
    check(done.status === "CONFIRMED" && done.confirmedAt, "claim CONFIRMED");
    check(
      done.invitation.status === "PUBLISHED" && done.invitation.slug === SLUG,
      `undangan PUBLISHED di alamat pilihan (${done.invitation.status} ${done.invitation.slug})`,
    );
    const days = (done.invitation.activeUntil!.getTime() - Date.now()) / 86400_000;
    check(days > 300 && days <= 366, `masa aktif mengikuti pengaturan (${Math.round(days)} hari)`);
    const pub = await fetch(`${base}/${SLUG}`);
    check(pub.status === 200, `undangan tayang: GET /${SLUG} → ${pub.status}`);
    if (same)
      check(
        (await customerEditError("CUSTOMER", done.invitation, same.id)) !== null,
        "setelah tayang: ganti tema ditolak (terkunci)",
      );
    check(
      (await customerEditError("CUSTOMER", done.invitation)) === null,
      "setelah tayang: ubah data masih boleh (masa aktif)",
    );

    // ── 6. dashboard pembeli ───────────────────────────────────────────────
    console.log("6. Dashboard pembeli /akun");
    await buyer.goto(`${base}/akun`, { waitUntil: "networkidle0" });
    check(
      buyer.url().includes(`/akun/undangan/${claim.invitationId}`),
      "/akun → langsung ke undangannya",
    );
    check((await bodyText(buyer)).includes("Tayang"), "status tayang tampil");
    await clickText(buyer, "button", "Tempel banyak");
    await buyer.type(
      "textarea",
      "Budi Santoso, 0812 1111 2222\nKeluarga Pak RT\nSiti, 0857 3333 4444, Teman kantor\n, 0812",
    );
    await clickText(buyer, "button", "Tambahkan semua");
    await buyer.waitForFunction(
      () => document.querySelectorAll("[data-testid=guest-row]").length >= 3,
      {
        timeout: 15000,
      },
    );
    const guests = await db.guest.findMany({ where: { invitationId: claim.invitationId } });
    check(
      guests.length === 3,
      `tempel massal: 3 tamu masuk, baris rusak dilewati (${guests.length})`,
    );
    check(
      guests.find((g) => g.name === "Siti")?.group === "Teman kantor",
      "grup dari baris tempel",
    );
    const waGuest = await buyer.$$eval("[data-testid=guest-row] a", (as) =>
      as.map((a) => (a as HTMLAnchorElement).href),
    );
    const budi = waGuest.find((h) => h.includes("6281211112222"));
    const budiText = budi ? decodeURIComponent(new URL(budi).searchParams.get("text") ?? "") : "";
    check(
      budiText.includes(`/${SLUG}?to=Budi`) && budiText.includes("Laras"),
      `tombol WA per tamu: nomor + link personal ?to= (${budiText.slice(-120)})`,
    );
    await shot(buyer, "07-akun-tamu");
    // tandai terkirim saat tombol WA diklik
    await buyer.evaluate(() => {
      window.open = () => null;
    });
    await buyer.$$eval("[data-testid=guest-row] a", (as) =>
      as.forEach((a) => a.addEventListener("click", (e) => e.preventDefault())),
    );
    await (await buyer.$("[data-testid=guest-row] a"))!.click();
    await sleep(1000);
    check(
      (await db.guest.count({
        where: { invitationId: claim.invitationId, NOT: { sentAt: null } },
      })) === 1,
      "klik WhatsApp → tamu ditandai terkirim",
    );
    await buyer.goto(`${base}/akun/undangan/${claim.invitationId}?tab=ucapan`, {
      waitUntil: "networkidle0",
    });
    check((await bodyText(buyer)).includes("Unduh ucapan"), "tab Ucapan & RSVP tampil");
    await buyer.goto(`${base}/akun/undangan/${claim.invitationId}/edit`, {
      waitUntil: "networkidle0",
    });
    check(
      (await bodyText(buyer)).includes("Lihat undangan"),
      "editor pembeli (setelah tayang) tampil",
    );
    check(!(await bodyText(buyer)).includes("Langkah 1/"), "editor pembeli tidak bertahap");

    // ── 8. keamanan pembeli ────────────────────────────────────────────────
    console.log("8. Keamanan");
    await buyer.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
    check(
      !buyer.url().includes("/dashboard"),
      `pembeli membuka /dashboard → dialihkan (${new URL(buyer.url()).pathname})`,
    );
    const adminInv = await db.invitation.findFirst({
      where: { NOT: { userId: done.invitation.userId } },
      select: { id: true },
    });
    if (adminInv) {
      const r = await buyer.goto(`${base}/akun/undangan/${adminInv.id}`, {
        waitUntil: "networkidle0",
      });
      check(r?.status() === 404, "undangan orang lain → 404");
      const p = await buyer.goto(`${base}/akun/undangan/${adminInv.id}/pratinjau`, {
        waitUntil: "networkidle0",
      });
      check(p?.status() === 404, "pratinjau undangan orang lain → 404");
    }
    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`${base}/akun`, { waitUntil: "networkidle0" });
    check(anonPage.url().includes("/masuk"), "tanpa login /akun → /masuk");
    const cross = await fetch(`${base}${claimPath}/masuk`, {
      method: "POST",
      headers: { origin: "https://jahat.example" },
      redirect: "manual",
    });
    check(cross.status === 403, "POST lintas situs ke /masuk link → 403");
    await anon.close();

    // ── 7. admin membuat akun login ────────────────────────────────────────
    console.log("7. Akun login pembeli");
    await admin.goto(`${base}/dashboard/link-khusus`, { waitUntil: "networkidle0" });
    await clickText(admin, "button", "Buat akun pembeli");
    await admin.waitForSelector("input[placeholder='email login pembeli']");
    await fill(admin, (await admin.$("input[placeholder='email login pembeli']"))!, BUYER_EMAIL);
    await clickText(admin, "button", "Buat kata sandi");
    await admin.waitForFunction(
      () =>
        [...document.querySelectorAll("textarea[readonly]")].some((t) =>
          (t as HTMLTextAreaElement).value.includes("Kata sandi"),
        ),
      { timeout: 15000 },
    );
    const loginMsg = await admin.$$eval("textarea[readonly]", (ts) =>
      ts.map((t) => (t as HTMLTextAreaElement).value).find((v) => v.includes("Kata sandi"))!,
    );
    const password = /Kata sandi: (\S+)/.exec(loginMsg)?.[1];
    check(!!password && loginMsg.includes(BUYER_EMAIL), "pesan login berisi email & kata sandi");
    const owner = await db.user.findUniqueOrThrow({ where: { id: done.invitation.userId } });
    check(
      owner.email === BUYER_EMAIL && owner.passwordHash && owner.passwordHash !== password,
      "kata sandi disimpan sebagai hash",
    );
    await shot(admin, "08-admin-akun");

    const ctxC = await browser.createBrowserContext();
    const login = await ctxC.newPage();
    await login.goto(`${base}/masuk`, { waitUntil: "networkidle0" });
    await login.type("#email", BUYER_EMAIL);
    await login.type("#password", "salah-salah-salah");
    await clickText(login, "button", "Masuk");
    await waitText(login, "Email atau kata sandi salah");
    check(true, "kata sandi salah → ditolak");
    await fill(login, (await login.$("#password"))!, password!);
    await clickText(login, "button[type=submit]", "Masuk");
    await login.waitForFunction(() => location.pathname.startsWith("/akun/undangan/"), {
      timeout: 30000,
    });
    check(
      login.url().includes(`/akun/undangan/${claim.invitationId}`),
      "login email/kata sandi → /akun",
    );
    await shot(login, "09-login-akun");
    await ctxC.close();

    // ── link dicabut / kedaluwarsa ────────────────────────────────────────
    console.log("9. Link dicabut / kedaluwarsa");
    const { createClaim } = await import("../src/lib/claims/service");
    const c2 = await createClaim({
      source: "MARKETPLACE",
      themeId: "lili",
      customerName: "Uji Dua",
    });
    createdInvitations.push(c2.claim.invitationId);
    await db.claimLink.update({
      where: { id: c2.claim.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const ctxD = await browser.createBrowserContext();
    const p2 = await ctxD.newPage();
    await p2.goto(`${base}/isi/${c2.token}`, { waitUntil: "networkidle0" });
    check((await bodyText(p2)).includes("kedaluwarsa"), "link kedaluwarsa → pesan");
    await db.claimLink.update({
      where: { id: c2.claim.id },
      data: { status: "REVOKED", expiresAt: new Date(Date.now() + 86400_000) },
    });
    await p2.reload({ waitUntil: "networkidle0" });
    check((await bodyText(p2)).includes("tidak berlaku"), "link dicabut → pesan");
    const r404 = await p2.goto(`${base}/isi/${"a".repeat(43)}`, { waitUntil: "networkidle0" });
    check((await bodyText(p2)).includes("tidak ditemukan") && r404, "token asal → tidak ditemukan");
    await ctxD.close();
    await ctxB.close();
  } finally {
    await ctxA?.close().catch(() => {});
    await browser.close();
    const owners = await db.invitation.findMany({
      where: { id: { in: createdInvitations } },
      select: { userId: true },
    });
    await db.invitation.deleteMany({ where: { id: { in: createdInvitations } } });
    await db.user.deleteMany({
      where: { id: { in: owners.map((o) => o.userId) }, role: "CUSTOMER" },
    });
    await db.$disconnect();
  }
  console.log(failed ? `\n✗ ${failed} cek gagal` : "\n✓ semua cek lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
