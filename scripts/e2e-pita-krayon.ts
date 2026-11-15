/**
 * Uji end-to-end tema Pita Krayon — Kartu Ucapan (form khusus tema) di
 * undangan TERBIT sungguhan (API & database asli). Development.
 *
 *   pnpm dev
 *   pnpm e2e:pita-krayon [base-url] [--shots=.reference/report/tema-baru]
 *
 *  - nama dari ?to= terisi otomatis ("Dari: … ubah")
 *  - pilih kehadiran → isian muncul; stepper jumlah orang hanya bila hadir
 *  - kirim → RSVP + ucapan tersimpan (satu kiriman), catatan terima kasih
 *    personal, ucapan baru di atas daftar berlabel "Ucapanmu"
 *  - galat: nama kosong & link di ucapan ditolak di browser; batas kiriman
 *    server tampil sebagai pesan ramah; honeypot tetap ada
 *  - teks ucapan tidak menjadi link; rekap kehadiran di editor (API) benar
 *  - link pratinjau: section ucapan tidak dirender
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import type { Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";
import { purchased } from "./lib/purchase";

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
const waitText = (p: Page, t: string, ms = 15000) =>
  p.waitForFunction(`document.body.innerText.includes(${JSON.stringify(t)})`, { timeout: ms }).then(
    () => true,
    () => false,
  );
const clickRole = (p: Page, name: string) =>
  p.evaluate(
    `[...document.querySelectorAll('#inv-ucapan button')].find((b) => b.textContent.trim().includes(${JSON.stringify(name)}))?.click()`,
  );

async function openCard(p: Page, url: string) {
  await p.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await p.waitForSelector("[data-inv-ready]", { timeout: 30000 });
  await sleep(800);
  await p.evaluate(`document.querySelector('[aria-label="Buka undangan"]')?.click()`);
  await sleep(1500);
  await p.evaluate(`document.getElementById("inv-ucapan")?.scrollIntoView()`);
  await sleep(1800);
}
async function shotCard(p: Page, name: string) {
  if (!shots) return;
  const el = await p.$("#inv-ucapan");
  await el?.screenshot({ path: `${shots}/ucapan-${name}.png` as `${string}.png` });
}

async function main() {
  assertSafeDatabase("e2e-pita-krayon");
  const owner = await db.user.upsert({
    where: { email: "e2e-pk@test.local" },
    update: {},
    create: { email: "e2e-pk@test.local", name: "Uji Pita Krayon" },
  });
  const slug = "uji-pita-krayon";
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "BIRTHDAY",
    name: "Aya Kirana Putri",
    nickname: "Aya",
    age: 19,
    date: new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Tangerang",
    themeId: "pita-krayon",
  }).data as Record<string, unknown> & { events: Record<string, unknown>[] };
  data.events[0] = { ...data.events[0], venueName: "Verte Bistro" };
  const inv = await db.invitation.create({
    data: {
      userId: owner.id,
      slug,
      eventType: "BIRTHDAY",
      themeId: "pita-krayon",
      ...purchased("pita-krayon"),
      status: "PUBLISHED",
      publishedAt: new Date(),
      data: data as Prisma.InputJsonValue,
    },
  });

  const browser = await launchBrowser();
  const p = await browser.newPage();
  await p.setViewport(MOBILE);

  console.log("Kosong & nama dari ?to=");
  await openCard(p, `${base}/${slug}?to=Bu%20Rina%20Wulandari`);
  let t = await text(p);
  check(
    t.includes("Kirim Ucapan") && t.includes("Kamu bisa datang ke pesta Aya?"),
    "judul & pertanyaan kartu",
  );
  check(
    (await p.$$('#inv-ucapan [role="radio"]')).length === 3,
    "3 ubin kehadiran (radio) — Hadir / Belum bisa / Masih ragu",
  );
  check(!(await p.$("#inv-ucapan textarea")), "isian baru muncul setelah memilih kehadiran");
  await shotCard(p, "1-kosong");
  const tileH = await p.$eval(
    '#inv-ucapan [role="radio"]',
    (e) => e.getBoundingClientRect().height,
  );
  check(tileH >= 56, `ubin cukup besar untuk jempol (${Math.round(tileH)} px ≥ 56)`);

  await clickRole(p, "Hadir");
  await sleep(500);
  t = await text(p);
  check(t.includes("Dari: Bu Rina Wulandari"), "nama dari ?to= terisi otomatis");
  check(t.includes("Datang berapa orang?"), "stepper jumlah orang (hadir)");
  const fs = await p.$eval("#inv-ucapan textarea", (e) => parseFloat(getComputedStyle(e).fontSize));
  check(fs >= 16, `font isian ≥ 16px (iOS tidak memperbesar halaman): ${fs}px`);
  await shotCard(p, "2-nama-dari-to");

  console.log("Galat di browser");
  await p.evaluate(`[...document.querySelectorAll('#inv-ucapan .pk-link')][0]?.click()`);
  await sleep(200);
  await p.$eval("#inv-ucapan input:not([name=website])", (e) => {
    const i = e as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    set.call(i, "");
    i.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await clickRole(p, "Kirim");
  check(await waitText(p, "Nama belum diisi."), "nama kosong → pesan galat di bawah isian");
  await p.type("#inv-ucapan input:not([name=website])", "Bu Rina Wulandari");
  await p.type("#inv-ucapan textarea", "cek www.contoh-promo.com ya");
  await clickRole(p, "Kirim");
  check(await waitText(p, "tidak boleh berisi tautan"), "link di ucapan ditolak");
  await sleep(400);
  await shotCard(p, "5-galat");
  check(
    (await db.wish.count({ where: { invitationId: inv.id } })) === 0,
    "kiriman ber-link tidak sampai ke server",
  );

  console.log("Kirim");
  await p.$eval("#inv-ucapan textarea", (e) => {
    const i = e as HTMLTextAreaElement;
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    set.call(i, "");
    i.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await p.evaluate(`document.querySelector('#inv-ucapan .pk-chips button')?.click()`);
  await sleep(200);
  check(
    (await p.$eval("#inv-ucapan textarea", (e) => (e as HTMLTextAreaElement).value)).includes(
      "Selamat ulang tahun, Aya!",
    ),
    "chip saran mengisi ucapan",
  );
  await p.click('#inv-ucapan button[aria-label="Tambah"]');
  await sleep(150);
  check((await text(p)).includes("2 orang"), "stepper: 2 orang");
  await sleep(3200); // lewati batas anti-bot "kiriman terlalu cepat"
  await clickRole(p, "Kirim");
  check(await waitText(p, "Makasih, Bu Rina!"), "catatan terima kasih personal (nama tamu)");
  t = await text(p);
  check(
    t.includes("Aya senang banget kamu bisa datang") && t.includes("Verte Bistro"),
    "pesan menyebut nama yang berulang tahun & tempat acara",
  );
  check(t.includes("Simpan ke Kalender"), "hadir → tombol Simpan ke Kalender");
  await sleep(1200);
  await shotCard(p, "3-setelah-kirim");
  const rsvp = await db.rsvp.findFirst({ where: { invitationId: inv.id } });
  const wish = await db.wish.findFirst({ where: { invitationId: inv.id } });
  check(rsvp?.status === "HADIR" && rsvp.pax === 2, "RSVP tersimpan: HADIR, 2 orang");
  check(!!wish && wish.name === "Bu Rina Wulandari", "ucapan tersimpan");
  check(await waitText(p, "Ucapanmu"), 'ucapan baru di daftar berlabel "Ucapanmu"');
  const first = await p.$eval("#inv-ucapan .pk-wish", (e) => ({
    cls: e.className,
    txt: (e as HTMLElement).innerText,
  }));
  check(
    first.cls.includes("is-new") && first.txt.includes("Bu Rina"),
    "ucapan baru paling atas & beranimasi",
  );
  check(!(await p.$("#inv-ucapan .pk-wish a")), "teks ucapan tidak pernah dijadikan link");
  await p.evaluate(
    `document.querySelector('#inv-ucapan .pk-wishes')?.scrollIntoView({block:'center'})`,
  );
  await sleep(600);
  await shotCard(p, "4-daftar");

  console.log("Rekap & muat ulang");
  const stats = (await (await fetch(`${base}/api/u/${slug}/wishes`)).json()) as {
    stats: { hadir: number; orang: number; ucapan: number };
  };
  check(
    stats.stats.hadir === 1 && stats.stats.orang === 2 && stats.stats.ucapan === 1,
    `rekap kehadiran benar (hadir ${stats.stats.hadir}, orang ${stats.stats.orang}, ucapan ${stats.stats.ucapan})`,
  );
  await openCard(p, `${base}/${slug}?to=Bu%20Rina%20Wulandari`);
  check((await text(p)).includes("2 tamu akan hadir · 1 ucapan"), "rekap tampil di kartu");
  check((await text(p)).includes("Ucapanmu"), "label Ucapanmu tetap setelah dimuat ulang");

  console.log("Tanpa ?to=: isi nama sendiri; tidak hadir");
  const g = await (await browser.createBrowserContext()).newPage();
  await g.setViewport(MOBILE);
  await openCard(g, `${base}/${slug}`);
  await clickRole(g, "Belum bisa");
  await sleep(400);
  check(!(await text(g)).includes("Datang berapa orang?"), "tidak hadir → tanpa stepper");
  await g.type("#inv-ucapan input:not([name=website])", "Om Budi");
  await sleep(3200);
  await clickRole(g, "Kirim");
  check(await waitText(g, "Makasih doanya, Om Budi"), "tidak hadir → pesan doa");
  check(
    (await db.rsvp.count({ where: { invitationId: inv.id, status: "TIDAK_HADIR" } })) === 1,
    "RSVP tidak hadir tersimpan (tanpa ucapan)",
  );

  console.log("Tata letak desktop setelah render ulang (padding section tetap)");
  const d = await (await browser.createBrowserContext()).newPage();
  await d.setViewport({ width: 1440, height: 900 });
  await d.goto(`${base}/preview/pita-krayon`, { waitUntil: "networkidle0", timeout: 90000 });
  await sleep(1500);
  await d.evaluate(`document.querySelector('[aria-label="Buka undangan"]')?.click()`);
  await sleep(2500);
  for (let y = 0; y < 9000; y += 150) {
    await d.evaluate(`window.scrollBy(0,150)`);
    await sleep(50);
  }
  await sleep(1200);
  const layout = (await d.evaluate(`(() => {
    const out = { noPad: [], over: [] };
    for (const sec of document.querySelectorAll(".pk-sec")) {
      const inner = sec.children[1];
      const cs = inner && getComputedStyle(inner);
      if (cs && parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) === 0 && !["inv-salam", "inv-hitungMundur"].includes(sec.id))
        out.noPad.push(sec.id);
      const r = sec.getBoundingClientRect();
      for (const e of sec.querySelectorAll('[data-a="strip"] > div')) {
        const b = e.getBoundingClientRect();
        if (b.bottom > r.bottom + 0.5 || b.right > r.right + 0.5) out.over.push(sec.id);
      }
    }
    return out;
  })()`)) as { noPad: string[]; over: string[] };
  check(
    layout.noPad.length === 0,
    `padding section tetap setelah render ulang (${layout.noPad.join(",") || "semua ok"})`,
  );
  check(
    layout.over.length === 0,
    `strip foto di dalam section (${layout.over.join(",") || "semua ok"})`,
  );
  await d.close();

  console.log("Link pratinjau: ucapan tidak dirender");
  const { createPreviewLink } = await import("../src/lib/invitations/preview-link");
  const { token } = await createPreviewLink(inv.id);
  const ph = await (await fetch(`${base}/p/${token}`)).text();
  check(
    !ph.includes('data-inv-section="ucapan"') && !ph.includes("Kirim Ucapan"),
    "link pratinjau tanpa Kartu Ucapan",
  );

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
