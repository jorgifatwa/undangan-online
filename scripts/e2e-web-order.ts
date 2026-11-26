/**
 * Uji end-to-end ALUR PEMESANAN WEBSITE di browser sungguhan:
 *
 *   pnpm dev            (tanpa MIDTRANS_SERVER_KEY → tombol "Simulasi bayar")
 *   pnpm e2e:web-order [base-url] [--shots=.reference/report/pesan-website]
 *
 *  1. coba tema → "Pesan tema ini" → form bertahap (mode browser, tanpa unggah)
 *  2. isian tersimpan di localStorage; TIDAK ada data di DB sebelum memesan
 *  3. langkah terakhir: harga tema + data pemesan → pesanan PENDING (tanpa undangan)
 *  4. simulasi lunas → undangan + link khusus (WEBSITE) berisi isian tadi,
 *     link tampil di halaman hasil, isian di browser dihapus
 *  5. link khusus → langsung di langkah Konfirmasi
 *  6. keamanan: halaman hasil tanpa kunci → tidak ditemukan; webhook tanpa
 *     signature valid → 401; verifikasi signature SHA-512
 * Hanya ke database lokal (assertSafeDatabase); data uji dibersihkan di akhir.
 */
import { createHash } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import type { ElementHandle, Page } from "puppeteer-core";

import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const EMAIL = "pemesan-web@example.com";

let failed = 0;
function check(ok: unknown, label: string) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
}
async function shot(page: Page, name: string) {
  if (!shots) return;
  const fs = await import("node:fs");
  fs.mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
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
async function fill(page: Page, el: ElementHandle<Element>, value: string) {
  await el.evaluate((e) => (e as HTMLInputElement).select());
  await page.keyboard.press("Backspace");
  await el.type(value);
}
const bodyText = (page: Page) => page.evaluate(() => document.body.innerText);
const waitText = (page: Page, text: string, timeout = 20000) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);

async function cleanup() {
  const orders = await db.webOrder.findMany({ where: { buyerEmail: EMAIL } });
  const claimIds = orders.map((o) => o.claimId).filter(Boolean) as string[];
  const claims = await db.claimLink.findMany({
    where: { id: { in: claimIds } },
    include: { invitation: { select: { userId: true } } },
  });
  await db.invitation.deleteMany({ where: { id: { in: claims.map((c) => c.invitationId) } } });
  await db.user.deleteMany({
    where: { id: { in: claims.map((c) => c.invitation.userId) }, role: "CUSTOMER" },
  });
  await db.webOrder.deleteMany({ where: { buyerEmail: EMAIL } });
}

async function main() {
  assertSafeDatabase("e2e-web-order");
  await cleanup();
  const browser = await launchBrowser();
  try {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log("1. Coba tema → Pesan tema ini");
    await page.goto(`${base}/preview/lili`, { waitUntil: "networkidle0" });
    const href = await page.$eval(
      "[data-testid=order-theme]",
      (a) => (a as HTMLAnchorElement).href,
    );
    check(href.includes("/pesan/lili"), 'tombol "Pesan tema ini" di halaman coba tema');
    await page.goto(href, { waitUntil: "networkidle0" });
    await waitText(page, "Langkah 1/");
    check(true, "form bertahap tampil");
    const before = {
      orders: await db.webOrder.count(),
      invitations: await db.invitation.count(),
    };
    const steps = await page.$$eval("ol[aria-label='Langkah pengisian'] button", (b) =>
      b.map((x) => x.textContent ?? ""),
    );
    check(
      steps.at(-1)?.includes("Pesan & bayar"),
      `langkah terakhir = pesan & bayar (${steps.length})`,
    );
    await shot(page, "01-form");

    console.log("2. Isi + simpan di browser");
    const profilIdx = steps.findIndex((s) => s.includes("Mempelai"));
    await clickText(page, "ol[aria-label='Langkah pengisian'] button", "Mempelai");
    await waitText(page, `Langkah ${profilIdx + 1}/`);
    // foto ada di langkah Mempelai; unggah baru bisa setelah bayar
    check(
      (await bodyText(page)).includes("diunggah setelah pembayaran") &&
        !(await page.$("input[type=file]")),
      "unggah foto dimatikan (catatan: setelah pembayaran)",
    );
    await shot(page, "01b-mempelai");
    const names = await page.$$("input[name$='fullName']");
    await fill(page, names[0], "Anindya Kirana");
    await fill(page, names[1], "Dimas Saputra");
    await fill(page, (await page.$("input[name='bride.nickname']"))!, "Anin");
    await fill(page, (await page.$("input[name='groom.nickname']"))!, "Dimas");
    await clickText(page, "button", "Simpan & lanjut");
    await waitText(page, `Langkah ${profilIdx + 2}/`);
    const stored = await page.evaluate(() => localStorage.getItem("undangku:pesan:WEDDING"));
    check(stored?.includes("Anindya Kirana"), "isian tersimpan di localStorage");
    check(
      (await db.webOrder.count()) === before.orders &&
        (await db.invitation.count()) === before.invitations,
      "belum ada data di database sebelum memesan",
    );
    await page.reload({ waitUntil: "networkidle0" });
    await waitText(page, `Langkah ${profilIdx + 2}/`);
    check(true, "muat ulang → lanjut dari langkah terakhir");
    await clickText(page, "ol[aria-label='Langkah pengisian'] button", "Mempelai");
    await waitText(page, `Langkah ${profilIdx + 1}/`);
    const restored = await page.$eval(
      "input[name='bride.fullName']",
      (e) => (e as HTMLInputElement).value,
    );
    check(restored === "Anindya Kirana", "isian dipulihkan dari browser");

    console.log("3. Pesan & bayar");
    await clickText(page, "ol[aria-label='Langkah pengisian'] button", "Pesan & bayar");
    await page.waitForSelector("[data-testid=order-price]");
    const price = await page.$eval("[data-testid=order-price]", (e) => e.textContent ?? "");
    check(/Rp\s?99\.000/.test(price), `harga tema tampil (${price})`);
    await shot(page, "02-bayar");
    await page.type("input[name=name]", "Anindya Pemesan");
    await page.type("input[name=email]", EMAIL);
    await page.type("input[name=phone]", "0813 9999 8888");
    await page.click("[data-testid=order-submit]");
    await page.waitForFunction(() => location.pathname === "/pesan/selesai", { timeout: 30000 });
    await waitText(page, "Menunggu pembayaran");
    const order = await db.webOrder.findFirstOrThrow({ where: { buyerEmail: EMAIL } });
    check(order.status === "PENDING" && order.amount === 99000, "pesanan PENDING Rp99.000");
    check(order.buyerPhone === "6281399998888", "nomor WA dinormalisasi");
    check(
      !order.claimId && (await db.invitation.count()) === before.invitations,
      "belum ada undangan sebelum lunas",
    );
    check(order.viewKeyHash.length === 64, "kunci halaman hasil disimpan sebagai hash");
    await shot(page, "03-menunggu");

    console.log("6. Keamanan");
    const other = await browser.createBrowserContext();
    const op = await other.newPage();
    await op.goto(`${base}/pesan/selesai?order_id=${order.midtransOrderId}`, {
      waitUntil: "networkidle0",
    });
    await waitText(op, "Pesanan tidak ditemukan");
    check(true, "browser lain (tanpa kunci) tidak bisa melihat pesanan");
    await other.close();
    const hook = await fetch(`${base}/api/midtrans/notification`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        order_id: order.midtransOrderId,
        status_code: "200",
        gross_amount: "99000.00",
        transaction_status: "settlement",
        signature_key: "palsu",
      }),
    });
    check(hook.status === 401, `webhook tanpa signature valid → ${hook.status}`);
    check(
      (await db.webOrder.findUniqueOrThrow({ where: { id: order.id } })).status === "PENDING",
      "webhook palsu tidak mengubah status",
    );
    process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-UJI";
    const { verifySignature, outcomeOf } = await import("../src/lib/midtrans");
    const n = { order_id: "WEB-X", status_code: "200", gross_amount: "99000.00" };
    const sig = createHash("sha512")
      .update(`${n.order_id}${n.status_code}${n.gross_amount}SB-Mid-server-UJI`)
      .digest("hex");
    check(verifySignature({ ...n, signature_key: sig }), "signature SHA-512 benar → diterima");
    check(
      !verifySignature({ ...n, gross_amount: "1.00", signature_key: sig }),
      "nominal diubah → ditolak",
    );
    check(
      outcomeOf({ transaction_status: "settlement" }) === "paid" &&
        outcomeOf({ transaction_status: "capture", fraud_status: "challenge" }) === "pending" &&
        outcomeOf({ transaction_status: "expire" }) === "expired" &&
        outcomeOf({ transaction_status: "deny" }) === "failed",
      "pemetaan status Midtrans",
    );
    delete process.env.MIDTRANS_SERVER_KEY;

    console.log("4. Lunas (simulasi)");
    await clickText(page, "button", "Simulasi bayar");
    await waitText(page, "Pembayaran berhasil");
    await page.waitForSelector("[data-testid=claim-link]", { timeout: 20000 });
    const claimHref = await page.$eval(
      "[data-testid=claim-link]",
      (a) => (a as HTMLAnchorElement).href,
    );
    check(/\/isi\/[A-Za-z0-9_-]{43}$/.test(claimHref), "link khusus tampil di halaman hasil");
    await shot(page, "04-lunas");
    const paid = await db.webOrder.findUniqueOrThrow({ where: { id: order.id } });
    check(paid.status === "PAID" && paid.paidAt && paid.claimId, "pesanan PAID + link dibuat");
    const claim = await db.claimLink.findUniqueOrThrow({
      where: { id: paid.claimId! },
      include: { invitation: true },
    });
    const data = claim.invitation.data as { bride: { fullName: string } };
    check(
      claim.source === "WEBSITE" && claim.price === 99000,
      "link khusus source WEBSITE, harga sama",
    );
    check(data.bride.fullName === "Anindya Kirana", "isian dari browser terpasang di undangan");
    check(
      claim.customerEmail === EMAIL && claim.customerPhone === "6281399998888",
      "data pemesan tersimpan di link",
    );
    check(JSON.stringify(paid.data) === "{}", "salinan isian di pesanan dikosongkan setelah lunas");
    check(
      !(await page.evaluate(() => localStorage.getItem("undangku:pesan:WEDDING"))),
      "isian di browser dihapus setelah lunas",
    );
    // idempoten: simulasi/webhook ganda tidak membuat link baru
    const { applyPaymentOutcome } = await import("../src/lib/web-orders/service");
    await applyPaymentOutcome(order.midtransOrderId, "paid");
    check(
      (await db.claimLink.count({ where: { customerEmail: EMAIL } })) === 1,
      "pembayaran ganda tidak membuat link ganda",
    );

    console.log("5. Link khusus → konfirmasi");
    await page.goto(claimHref, { waitUntil: "networkidle0" });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      clickText(page, "button", "Mulai isi undangan"),
    ]);
    await page.waitForSelector("#claim-slug", { timeout: 20000 });
    const label = await bodyText(page);
    check(/Langkah (\d+)\/\1/.test(label), "dibuka langsung di langkah Konfirmasi");
    check(label.includes("Anin & Dimas"), "judul memakai isian pemesan");
    await shot(page, "05-link-khusus");
    await ctx.close();
  } finally {
    await browser.close();
    await cleanup();
    await db.$disconnect();
  }
  console.log(failed ? `\n✗ ${failed} cek gagal` : "\n✓ semua cek lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
