/**
 * Uji end-to-end LINK PRATINJAU RAHASIA /p/{token} — development.
 *
 *   pnpm dev
 *   pnpm e2e:preview-link [base-url] [--shots=.reference/report/pratinjau]
 *
 *  - pemilik membuat link dari editor ("Bagikan pratinjau"); hanya hash token di DB
 *  - dibuka TANPA login; selalu data draf terbaru
 *  - tanda "PRATINJAU — belum diterbitkan" selalu tampil (cover, isi, akhir halaman)
 *  - RSVP, ucapan & amplop digital tidak dirender (pratinjau pemilik tetap ada)
 *  - noindex (meta + header), no-referrer, metadata tanpa nama
 *  - kedaluwarsa 7 hari, dicabut, link baru mencabut link lama, token salah,
 *    undangan ditangguhkan → 404
 */
import { createHash } from "node:crypto";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Browser, Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";

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
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
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
const status = async (path: string) => (await fetch(`${base}${path}`)).status;

/** Watermark terpasang, terlihat, di lapisan teratas & menutupi seluruh layar. */
const watermarkOk = (p: Page) =>
  p.evaluate(`(() => {
    const el = document.querySelector("[data-preview-watermark]");
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility === "visible" && Number(cs.opacity) === 1 &&
      cs.position === "fixed" && cs.zIndex === "2147483647" && cs.pointerEvents === "none" &&
      r.top <= 0 && r.left <= 0 && r.width >= innerWidth && r.height >= innerHeight &&
      el.innerText.includes("PRATINJAU — belum diterbitkan");
  })()`) as Promise<boolean>;

const sections = (p: Page) =>
  p.$$eval("[data-inv-section]", (els) => els.map((e) => e.getAttribute("data-inv-section")!));

async function openInvitation(p: Page) {
  await p.waitForSelector("[data-inv-ready]", { timeout: 30000 });
  await sleep(800);
  await p.evaluate(`document.querySelector('[aria-label="Buka undangan"]')?.click()`);
  await sleep(2500);
}

async function main() {
  assertSafeDatabase("e2e-preview-link");
  const owner = await db.user.upsert({
    where: { email: "e2e-pl@test.local" },
    update: {},
    create: { email: "e2e-pl@test.local", name: "Uji Pratinjau" },
  });
  const slug = "uji-link-pratinjau";
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Laras Sekar",
    brideNickname: "Laras",
    groomName: "Bima Anggara",
    groomNickname: "Bima",
    date: new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Solo",
    greeting: "islami",
    quoteId: "ar-rum-21",
    themeId: "renda-rimba",
  }).data as Record<string, unknown>;
  data.gift = { accounts: [{ bank: "BCA", number: "1234567890", holder: "Laras Sekar" }] };
  const inv = await db.invitation.create({
    data: {
      userId: owner.id,
      slug,
      eventType: "WEDDING",
      themeId: "renda-rimba",
      data: data as Prisma.InputJsonValue,
    },
  });
  const token = await encode({
    token: { sub: owner.id, id: owner.id, name: owner.name, email: owner.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const shot = async (p: Page, n: string) => {
    if (shots) await p.screenshot({ path: `${shots}/${n}.png` as `${string}.png` });
  };

  const browser: Browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(MOBILE);
  await page.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  page.on("dialog", (d) => void d.accept());

  console.log("Pemilik membuat link");
  await page.goto(`${base}/dashboard/undangan/${inv.id}/edit`, {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await page.click('[data-testid="open-preview-link"]');
  check(await waitText(page, "Buat link pratinjau"), "dialog Bagikan pratinjau terbuka");
  await clickText(page, "Buat link pratinjau");
  await page.waitForSelector('[data-testid="preview-link-new"] code', { timeout: 15000 });
  const url1 = await page.$eval('[data-testid="preview-link-new"] code', (e) => e.textContent!);
  check(/\/p\/[A-Za-z0-9_-]{43}$/.test(url1), `link berbentuk /p/{token 43 karakter}`);
  check((await text(page)).includes("tidak bisa ditampilkan lagi"), "peringatan: salin sekarang");
  await shot(page, "1-dialog-link-baru");
  const token1 = url1.split("/p/")[1];
  const rows = await db.previewLink.findMany({ where: { invitationId: inv.id } });
  check(
    rows.length === 1 &&
      rows[0].tokenHash === createHash("sha256").update(token1).digest("hex") &&
      !JSON.stringify(rows).includes(token1),
    "DB hanya menyimpan hash token (bukan token)",
  );
  check(
    Math.abs(rows[0].expiresAt.getTime() - rows[0].createdAt.getTime() - 7 * DAY) < 5000,
    "kedaluwarsa = dibuat + 7 hari",
  );
  const path1 = new URL(url1).pathname;

  console.log("Dibuka tanpa login");
  const guestCtx = await browser.createBrowserContext();
  const g = await guestCtx.newPage();
  await g.setViewport(MOBILE);
  const res = await g.goto(`${base}${path1}`, { waitUntil: "networkidle0", timeout: 90000 });
  check(res?.status() === 200, "tanpa login: 200");
  const h = res!.headers();
  check(/noindex/.test(h["x-robots-tag"] ?? ""), "header X-Robots-Tag noindex");
  check(h["referrer-policy"] === "no-referrer", "header Referrer-Policy no-referrer");
  check(/no-store/.test(h["cache-control"] ?? ""), "header Cache-Control no-store");
  const head = (await g.evaluate("document.head.innerHTML")) as string;
  check(/<meta name="robots" content="noindex/.test(head), "meta robots noindex");
  check(
    !/Laras|Bima|Solo/.test(await g.title()) &&
      !/Laras|Bima/.test(head.replace(/<style[\s\S]*?<\/style>/g, "")),
    "metadata/judul tanpa nama mempelai",
  );
  await g.waitForSelector("[data-inv-ready]", { timeout: 30000 });
  await sleep(800);
  check(await watermarkOk(g), "watermark tampil di cover (lapisan teratas, penuh layar)");
  await shot(g, "2-cover-dengan-watermark");
  await openInvitation(g);
  check((await text(g)).includes("Laras"), "isi undangan tampil");
  const secs = await sections(g);
  check(
    !secs.includes("rsvp") && !secs.includes("ucapan") && !secs.includes("amplop"),
    `RSVP, ucapan & amplop tidak dirender (${secs.join(",")})`,
  );
  check(!(await text(g)).includes("1234567890"), "nomor rekening tidak ada di halaman");
  check(
    !(await g.content()).includes("1234567890"),
    "nomor rekening tidak ada di HTML (termasuk data RSC)",
  );
  check(
    !(await g.content()).includes("foto-kosong.svg"),
    "link pratinjau tanpa penanda foto kosong",
  );
  await g.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
  await sleep(1200);
  check(await watermarkOk(g), "watermark tetap tampil di akhir halaman");
  // Coba sembunyikan lewat CSS halaman (mis. tema/ekstensi menambah gaya umum)
  await g.addStyleTag({ content: "div { opacity: .5 } [style] { z-index: 1 }" });
  check(
    (await g.evaluate(
      `getComputedStyle(document.querySelector("[data-preview-watermark]")).zIndex`,
    )) === "2147483647",
    "gaya inline: CSS umum tidak menurunkan lapisan watermark",
  );
  await shot(g, "3-isi-dengan-watermark");

  console.log("Pratinjau pemilik tetap lengkap");
  await page.goto(`${base}/dashboard/undangan/${inv.id}/pratinjau`, { waitUntil: "networkidle0" });
  await openInvitation(page);
  const own = await sections(page);
  check(
    own.includes("amplop") && own.includes("ucapan"),
    `pratinjau pemilik: amplop & ucapan/RSVP ada (${own.join(",")})`,
  );

  console.log("Selalu data draf terbaru");
  const d2 = {
    ...data,
    bride: { ...(data.bride as Record<string, unknown>), nickname: "Larasati" },
  };
  await db.invitation.update({
    where: { id: inv.id },
    data: { data: d2 as Prisma.InputJsonValue },
  });
  check(
    (await (await fetch(`${base}${path1}`)).text()).includes("Larasati"),
    "perubahan draf langsung tampil",
  );

  console.log("Token salah / kedaluwarsa / dicabut / ditangguhkan → 404");
  check((await status(`/p/${"A".repeat(43)}`)) === 404, "token salah → 404");
  check((await status(`/p/abc`)) === 404, "token format salah → 404");
  await db.previewLink.updateMany({
    where: { invitationId: inv.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  check((await status(path1)) === 404, "lewat 7 hari → 404");
  const exp404 = await (await fetch(`${base}${path1}`)).text();
  check(!exp404.includes("Laras"), "404 tanpa data pribadi");
  await db.previewLink.updateMany({
    where: { invitationId: inv.id },
    data: { expiresAt: new Date(Date.now() + DAY) },
  });
  check((await status(path1)) === 200, "(kembali berlaku untuk uji berikut)");

  // Dialog dibuka ulang: link aktif terdeteksi; buat link baru → link lama mati
  await page.goto(`${base}/dashboard/undangan/${inv.id}/edit`, { waitUntil: "networkidle0" });
  await page.click('[data-testid="open-preview-link"]');
  check(await waitText(page, "Ada link pratinjau aktif"), "editor: menampilkan link aktif");
  await clickText(page, "Buat link baru");
  await page.waitForSelector('[data-testid="preview-link-new"] code', { timeout: 15000 });
  const url2 = await page.$eval('[data-testid="preview-link-new"] code', (e) => e.textContent!);
  const path2 = new URL(url2).pathname;
  check(path2 !== path1, "link baru berbeda");
  check((await status(path1)) === 404, "link lama otomatis dicabut → 404");
  check((await status(path2)) === 200, "link baru → 200");
  check(
    (await db.previewLink.count({ where: { invitationId: inv.id, revokedAt: null } })) === 1,
    "hanya satu link aktif per undangan",
  );
  await clickText(page, "Cabut link");
  await sleep(1500);
  check((await status(path2)) === 404, "dicabut → 404");
  await shot(page, "4-dialog-setelah-cabut");

  await clickText(page, "Buat link pratinjau");
  await page.waitForSelector('[data-testid="preview-link-new"] code', { timeout: 15000 });
  const path3 = new URL(
    await page.$eval('[data-testid="preview-link-new"] code', (e) => e.textContent!),
  ).pathname;
  check((await status(path3)) === 200, "link baru setelah dicabut → 200");
  await db.invitation.update({
    where: { id: inv.id },
    data: { suspendedAt: new Date(), suspendReason: "Uji" },
  });
  check((await status(path3)) === 404, "undangan ditangguhkan → link pratinjau 404");
  await db.invitation.update({
    where: { id: inv.id },
    data: { suspendedAt: null, suspendReason: null },
  });

  console.log("Tidak memengaruhi status terbit");
  const row = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
  check(row.status === "DRAFT" && !row.purchasedAt, "undangan tetap draf belum dibeli");
  check((await status(`/${slug}`)) === 404, "/slug tetap 404 (belum terbit)");

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
