/**
 * Uji end-to-end editor undangan (development) di browser sungguhan.
 *
 *   pnpm dev
 *   pnpm e2e:editor [base-url] [--shots=.reference/report/3b]
 *
 * Memakai user uji e2e-a / e2e-b (lihat e2e-dashboard.ts) dan membuat ulang
 * undangan uji langsung di DB. Yang diuji:
 *  - editor tampil (desktop & mobile), pratinjau = komponen tema sungguhan
 *  - autosave 2 dtk + indikator, pratinjau ikut berubah tanpa reload
 *  - isian tidak valid → tidak disimpan, pesan bahasa Indonesia
 *  - cadangan localStorage + tawaran "Pulihkan" setelah reload
 *  - pengaturan section (sembunyi), gembok section terkunci, ganti tema & varian
 *  - kutipan siap pakai
 *  - konflik dua tab (updatedAt)
 *  - keamanan: payload autosave dirusak di jaringan → ditolak server;
 *    id undangan orang lain → ditolak; postMessage dari sumber lain diabaikan
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Frame, HTTPRequest, Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
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

async function user(email: string, name: string) {
  const u = await db.user.upsert({ where: { email }, update: { name }, create: { email, name } });
  const token = await encode({
    token: { sub: u.id, id: u.id, name, email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });
  return { u, token };
}

async function makeInvitation(userId: string, slug: string, themeId: string) {
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Larasati Wulandari",
    brideNickname: "Laras",
    groomName: "Bima Prasetya",
    groomNickname: "Bima",
    date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Yogyakarta",
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
      colorVariant: null,
      data: data as Prisma.InputJsonValue,
    },
  });
}

const shot = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` as `${string}.png` });
};
const text = (page: Page) => page.evaluate("document.body.innerText") as Promise<string>;
const frameOf = (page: Page) =>
  page.frames().find((f) => f.url().includes("/pratinjau?editor=1")) as Frame;
const frameText = async (page: Page) =>
  (await frameOf(page).evaluate("document.body.innerText")) as string;
const clickText = (page: Page, t: string, sel = "button") =>
  page.evaluate(
    `[...document.querySelectorAll(${JSON.stringify(sel)})].find((b) => b.textContent.includes(${JSON.stringify(t)}))?.click()`,
  );
async function typeInto(page: Page, selector: string, value: string) {
  await page.click(selector, { count: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value);
}
async function waitStatus(page: Page, s: string, ms = 8000) {
  try {
    await page.waitForFunction(
      `document.querySelector('[role="status"]')?.textContent.includes(${JSON.stringify(s)})`,
      { timeout: ms },
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  assertSafeDatabase("e2e-editor");
  const a = await user("e2e-a@test.local", "Uji A");
  const b = await user("e2e-b@test.local", "Uji B");
  const invA = await makeInvitation(a.u.id, "uji-editor-a", "renda-rimba");
  const invB = await makeInvitation(b.u.id, "uji-editor-b", "renda-rimba");

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  await page.setCookie({
    name: COOKIE,
    value: a.token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  const url = `${base}/dashboard/undangan/${invA.id}/edit`;

  console.log("Editor tampil");
  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await page.waitForFunction(
    `!!document.querySelector("iframe")?.contentDocument?.querySelector("[data-inv-ready]")`,
    {
      timeout: 60000,
    },
  );
  await sleep(1500);
  check((await text(page)).includes("Tersimpan"), "indikator awal: Tersimpan");
  check(
    (await frameText(page)).includes("Laras"),
    "pratinjau memakai komponen tema dengan data undangan",
  );
  await shot(page, "editor-desktop");

  console.log("Autosave + pratinjau langsung");
  await clickText(page, "Mempelai");
  await sleep(400);
  await typeInto(page, "#f-bride-nickname", "Larasita");
  await sleep(600);
  check((await frameText(page)).includes("Larasita"), "pratinjau berubah tanpa reload (< 1 dtk)");
  check(await waitStatus(page, "Menyimpan", 4000).then(() => true), "indikator Menyimpan…");
  check(await waitStatus(page, "Tersimpan"), "indikator Tersimpan");
  const afterSave = await db.invitation.findUnique({ where: { id: invA.id } });
  check(JSON.stringify(afterSave?.data).includes("Larasita"), "tersimpan ke database");
  await shot(page, "editor-mempelai");

  console.log("Validasi");
  await clickText(page, "Acara");
  await sleep(400);
  await typeInto(page, "#f-events-0-mapsUrl", "bukan-link");
  await page.click("#f-events-0-venueName");
  await sleep(2600);
  const t1 = await text(page);
  check(t1.includes("Link tidak valid"), "pesan galat bahasa Indonesia");
  check(t1.includes("Belum disimpan"), "isian tidak valid tidak disimpan");
  const dbInvalid = await db.invitation.findUnique({ where: { id: invA.id } });
  check(
    !JSON.stringify(dbInvalid?.data).includes("bukan-link"),
    "database tidak berisi isian tidak valid",
  );
  await shot(page, "editor-validasi");
  await typeInto(page, "#f-events-0-mapsUrl", "https://maps.app.goo.gl/contoh");
  check(await waitStatus(page, "Tersimpan"), "setelah diperbaiki → tersimpan");

  console.log("Cadangan lokal (localStorage)");
  await clickText(page, "Mempelai");
  await sleep(400);
  await typeInto(page, "#f-groom-nickname", "Bimo");
  await sleep(700); // < 2 dtk: belum tersimpan ke server, sudah di localStorage
  page.on("dialog", (d) => void d.accept());
  await page.goto(url, { waitUntil: "networkidle0" });
  await sleep(1200);
  check(
    (await text(page)).includes("Pulihkan perubahan yang belum tersimpan"),
    "tawaran pulihkan muncul setelah reload",
  );
  await shot(page, "editor-pulihkan");
  await clickText(page, "Pulihkan perubahan");
  check(await waitStatus(page, "Tersimpan"), "dipulihkan lalu tersimpan");
  const restored = await db.invitation.findUnique({ where: { id: invA.id } });
  check(JSON.stringify(restored?.data).includes("Bimo"), "hasil pemulihan tersimpan ke database");
  check(
    !(await page.evaluate(`localStorage.getItem("undangku:draf:${invA.id}")`)),
    "draf lokal dihapus setelah tersimpan",
  );

  console.log("Kutipan siap pakai");
  await clickText(page, "Ayat / kutipan");
  await sleep(400);
  await page.select("#f-quote-preset", "matius-19-6");
  await sleep(800);
  check(
    (await frameText(page)).includes("apa yang telah dipersatukan Allah"),
    "kutipan Matius 19:6 tampil di pratinjau",
  );
  check(await waitStatus(page, "Tersimpan"), "kutipan tersimpan");
  await shot(page, "editor-kutipan");

  console.log("Section & tema");
  await clickText(page, "Urutan & tampilan section");
  await sleep(400);
  await page.evaluate(`document.querySelector('[aria-label="Tampilkan Love Story"]')?.click()`);
  check(await waitStatus(page, "Tersimpan"), "sembunyikan section tersimpan");
  const cfg = (await db.invitation.findUnique({ where: { id: invA.id } }))?.data as {
    sections: { id: string; visible: boolean }[];
  };
  check(
    cfg.sections.some((s) => s.id === "loveStory" && !s.visible),
    "data.sections berisi loveStory: tersembunyi",
  );
  await shot(page, "editor-section");
  await clickText(page, "Tema, warna & alamat");
  await sleep(300);
  await page.evaluate(
    `[...document.querySelectorAll('[role="radio"]')].find((b) => b.textContent.includes("Tirai Beludru"))?.click()`,
  );
  await sleep(1500);
  check(
    !!(await frameOf(page).evaluate(`!!document.querySelector('[data-theme="tirai-beludru"]')`)),
    "ganti tema → pratinjau Tirai Beludru tanpa reload",
  );
  check(await waitStatus(page, "Tersimpan"), "tema tersimpan");
  await clickText(page, "Urutan & tampilan section");
  await sleep(400);
  const lockedDisabled = await page.evaluate(
    `document.querySelector('[aria-label="Tampilkan Ayat / Kutipan"]')?.disabled`,
  );
  check(lockedDisabled === true, "Tirai: section ayat terkunci (🔒, tidak bisa disembunyikan)");
  await shot(page, "editor-tirai-section");

  console.log("Mobile");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "networkidle0" });
  await sleep(1500);
  await shot(page, "editor-mobile-edit");
  await clickText(page, "Pratinjau", '[role="tab"]');
  await sleep(2500);
  await shot(page, "editor-mobile-pratinjau");
  await page.setViewport({ width: 1366, height: 900 });

  console.log("Konflik dua tab");
  await page.goto(url, { waitUntil: "networkidle0" });
  await sleep(1200);
  await db.invitation.update({ where: { id: invA.id }, data: { colorVariant: "sage" } }); // "tab lain"
  await clickText(page, "Mempelai");
  await sleep(300);
  await typeInto(page, "#f-bride-instagram", "laras.w");
  check(await waitStatus(page, "Diubah di tempat lain"), "konflik terdeteksi, tidak menimpa");
  await shot(page, "editor-konflik");

  console.log("Keamanan server (payload dirusak di jaringan)");
  async function tamper(mutate: (args: unknown[]) => unknown[], expect: string, label: string) {
    await page.goto(url, { waitUntil: "networkidle0" });
    await sleep(1200);
    await page.setRequestInterception(true);
    const handler = (req: HTTPRequest) => {
      const isAction = req.method() === "POST" && !!req.headers()["next-action"];
      if (!isAction) return void req.continue();
      try {
        const body = JSON.parse(req.postData() ?? "[]") as unknown[];
        return void req.continue({ postData: JSON.stringify(mutate(body)) });
      } catch {
        return void req.continue();
      }
    };
    page.on("request", handler);
    await clickText(page, "Mempelai");
    await sleep(300);
    await typeInto(
      page,
      "#f-bride-childOrder",
      `Putri ke-${Math.random().toString(36).slice(2, 5)}`,
    );
    const ok = await waitStatus(page, expect, 9000);
    check(ok, label);
    page.off("request", handler);
    await page.setRequestInterception(false);
  }
  await tamper(
    (x) => {
      const p = x[1] as { data: { bride: { fullName: string } } };
      p.data.bride.fullName = "";
      return x;
    },
    "Ada isian yang belum valid",
    "nama dikosongkan di jaringan → ditolak server (validasi Zod)",
  );
  await tamper(
    (x) => {
      x[0] = invB.id;
      return x;
    },
    "Undangan tidak ditemukan",
    "id undangan milik user lain → ditolak server",
  );
  const bAfter = await db.invitation.findUnique({ where: { id: invB.id } });
  check(bAfter?.updatedAt.getTime() === invB.updatedAt.getTime(), "undangan user B tidak berubah");

  console.log("postMessage");
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    `!!document.querySelector("iframe")?.contentDocument?.querySelector("[data-inv-ready]")`,
  );
  await sleep(1000);
  const fake = (await frameOf(page).evaluate(`(() => {
    const d = { ns: "undangku", type: "update", themeId: "renda-rimba", variantId: null,
      data: { bride: { fullName: "PENYUSUP" }, groom: { fullName: "X" }, events: [{ id: "a", name: "a", date: "2027-01-01" }] } };
    window.postMessage(d, location.origin); // sumber = iframe sendiri, bukan parent
    return new Promise((r) => setTimeout(() => r(document.body.innerText.includes("PENYUSUP")), 800));
  })()`)) as boolean;
  check(!fake, "pesan dari sumber selain editor diabaikan");
  const bad = (await page.evaluate(`(() => {
    const f = document.querySelector("iframe");
    f.contentWindow.postMessage({ ns: "undangku", type: "update", themeId: "renda-rimba", variantId: null, data: { bride: { fullName: "" } } }, location.origin);
    f.contentWindow.postMessage({ ns: "lain", type: "update" }, location.origin);
    return new Promise((r) => setTimeout(() => r(f.contentDocument.body.innerText.includes("Laras")), 800));
  })()`)) as boolean;
  check(bad, "pesan berformat salah / data tidak valid diabaikan (pratinjau tetap)");

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
