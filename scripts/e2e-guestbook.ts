/**
 * Uji end-to-end RSVP & ucapan (4b) — development.
 *
 *   pnpm dev
 *   pnpm e2e:guestbook [base-url] [--shots=.reference/report/4b]
 */
import { randomBytes } from "node:crypto";

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
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};

async function invitation(
  userId: string,
  slug: string,
  eventType: "WEDDING" | "BIRTHDAY",
  themeId: string,
  status: "PUBLISHED" | "DRAFT" = "PUBLISHED",
  pkg: "BASIC" | "PREMIUM" = "BASIC",
) {
  await db.invitation.deleteMany({ where: { slug } });
  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  const data = buildInitialData(
    eventType === "WEDDING"
      ? {
          eventType,
          brideName: "Nadia Putri",
          brideNickname: "Nadia",
          groomName: "Fajar Ramadhan",
          groomNickname: "Fajar",
          date,
          timezone: "WIB",
          city: "Bogor",
          greeting: "islami",
          quoteId: "ar-rum-21",
          themeId,
        }
      : {
          eventType,
          name: "Aira Salsabila",
          nickname: "Aira",
          age: 6,
          date,
          timezone: "WIB",
          city: "Depok",
          themeId,
        },
  ).data;
  return db.invitation.create({
    data: {
      userId,
      slug,
      eventType,
      themeId,
      package: pkg,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      data: data as Prisma.InputJsonValue,
    },
  });
}

let ipSeq = 10;
const nextIp = () => `203.0.113.${ipSeq++}`;
const newDevice = () => randomBytes(16).toString("hex");
/** Kiriman API sebagai tamu: IP (X-Forwarded-For) & cookie perangkat; device null = tanpa cookie. */
async function post(
  slug: string,
  body: Record<string, unknown>,
  ip = nextIp(),
  device: string | null = newDevice(),
) {
  const r = await fetch(`${base}/api/u/${slug}/guestbook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
      ...(device ? { Cookie: `udk_dev=${device}` } : {}),
    },
    body: JSON.stringify({ startedAt: Date.now() - 10_000, ...body }),
  });
  return {
    status: r.status,
    setCookie: r.headers.get("set-cookie"),
    json: (await r.json().catch(() => ({}))) as { error?: string; rateLimited?: boolean },
  };
}
const text = (p: Page) => p.evaluate("document.body.innerText") as Promise<string>;

async function openToGuestbook(p: Page, url: string) {
  await p.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await p.waitForSelector("[data-inv-ready]");
  await sleep(1200);
  const el = await p.$('[aria-label="Buka undangan"]');
  if (el) await el.click();
  else
    await p.evaluate(
      `[...document.querySelectorAll("button")].find((b) => /Buka Undangan/i.test(b.textContent))?.click()`,
    );
  await sleep(2500);
  await p.evaluate(`document.getElementById("inv-ucapan")?.scrollIntoView()`);
  await sleep(1500);
}

async function main() {
  assertSafeDatabase("e2e-guestbook");
  const owner = await db.user.upsert({
    where: { email: "e2e-a@test.local" },
    update: {},
    create: { email: "e2e-a@test.local", name: "Uji A" },
  });
  const inv = await invitation(owner.id, "nadia-fajar-uji", "WEDDING", "renda-rimba");
  const bday = await invitation(owner.id, "aira-ultah-uji", "BIRTHDAY", "confetti-party");
  const draft = await invitation(owner.id, "uji-bukutamu-draf", "WEDDING", "renda-rimba", "DRAFT");
  void draft;

  const browser = await launchBrowser();
  const ctxA = await browser.createBrowserContext();
  const ctxB = await browser.createBrowserContext();
  const tamuA = await ctxA.newPage();
  const tamuB = await ctxB.newPage();
  for (const p of [tamuA, tamuB])
    await p.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

  console.log("Tamu mengirim lewat halaman undangan (Renda Rimba)");
  await openToGuestbook(tamuB, `${base}/${inv.slug}`);
  await openToGuestbook(tamuA, `${base}/${inv.slug}?to=Bu%20Siti`);
  await sleep(2500); // > 3 dtk sejak form tampil
  await tamuA.click("#rr-msg");
  await tamuA.type("#rr-msg", "Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.");
  await tamuA.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Hadir") && !b.textContent.includes("Tidak"))?.click()`,
  );
  await tamuA.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Kirim")?.click()`,
  );
  await sleep(2000);
  const rows = await db.wish.findMany({ where: { invitationId: inv.id } });
  const rsvps = await db.rsvp.findMany({ where: { invitationId: inv.id } });
  check(
    rows.length === 1 && rows[0].name === "Bu Siti" && rows[0].attendance === "HADIR",
    "ucapan tersimpan ke tabel Wish (nama dari ?to=, kehadiran)",
  );
  check(rsvps.length === 1 && rsvps[0].status === "HADIR", "konfirmasi tersimpan ke tabel Rsvp");
  check(
    !!rows[0]?.ipHash && !/\d+\.\d+\.\d+\.\d+/.test(rows[0].ipHash),
    "IP disimpan sebagai hash, bukan IP mentah",
  );
  check((await text(tamuA)).includes("1 Ucapan · 1 Hadir"), "rekap di Dinding Tamu dari server");
  if (shots) await tamuA.screenshot({ path: `${shots}/1-tamu-kirim.png` });

  console.log("Realtime (polling) di tamu lain");
  const seen = await tamuB
    .waitForFunction(`document.body.innerText.includes("semoga sakinah mawaddah")`, {
      timeout: 25000,
    })
    .then(
      () => true,
      () => false,
    );
  check(seen, "ucapan baru muncul di perangkat tamu lain tanpa reload (≤ 20 dtk)");
  if (shots) await tamuB.screenshot({ path: `${shots}/2-tamu-lain-realtime.png` });

  console.log("Batas tercapai di halaman tamu → pesan ramah");
  const devA = (await tamuA.cookies()).find((c) => c.name === "udk_dev")?.value;
  check(
    !!devA && rows[0]?.deviceId === devA,
    "cookie perangkat httpOnly dibuat saat membuka undangan & dipakai saat kirim",
  );
  check(
    (await tamuA.cookies()).find((c) => c.name === "udk_dev")?.httpOnly === true,
    "cookie perangkat httpOnly",
  );
  for (let i = 0; i < 4; i++)
    await post(inv.slug, { name: "Bu Siti", message: `isi ke-${i}` }, nextIp(), devA!);
  await tamuA.evaluate(`document.getElementById("inv-ucapan")?.scrollIntoView()`);
  await tamuA.click("#rr-msg");
  await tamuA.type("#rr-msg", "Doa tambahan dari Bu Siti");
  await tamuA.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Kirim")?.click()`,
  );
  const soft = await tamuA
    .waitForFunction(
      `[...document.querySelectorAll('[role="status"]')].some((e) => e.textContent.includes("Terlalu banyak ucapan dalam waktu singkat"))`,
      { timeout: 8000 },
    )
    .then(
      () => true,
      () => false,
    );
  check(soft, 'tamu melihat pesan ramah (role="status", bukan alert)');
  check(
    (await tamuA.$eval("#rr-msg", (e) => (e as HTMLTextAreaElement).value)) ===
      "Doa tambahan dari Bu Siti",
    "isi ucapan tidak hilang, bisa dikirim lagi nanti",
  );
  if (shots) await tamuA.screenshot({ path: `${shots}/2b-batas-pesan-ramah.png` });

  console.log("Anti-spam (API)");
  const before = await db.wish.count({ where: { invitationId: inv.id } });
  let r = await post(inv.slug, { name: "Bot", message: "halo", website: "http://spam.example" });
  check(
    r.status === 200 && (await db.wish.count({ where: { invitationId: inv.id } })) === before,
    "honeypot terisi → tampak sukses, tidak disimpan",
  );
  r = await post(inv.slug, { name: "Bot Cepat", message: "halo cepat", startedAt: Date.now() });
  check(
    r.status === 200 && (await db.wish.count({ where: { invitationId: inv.id } })) === before,
    "dikirim < 3 dtk → tidak disimpan",
  );
  r = await post(inv.slug, { name: "Promo", message: "Diskon besar cek www.tokoku.com sekarang" });
  check(r.status === 400 && /tautan/.test(r.json.error ?? ""), "ucapan berisi link ditolak");
  r = await post(inv.slug, { name: "Promo", message: "hubungi wa.me/62812" });
  check(r.status === 400, "link wa.me ditolak");
  r = await post(inv.slug, { name: "Panjang", message: "a".repeat(600) });
  check(r.status === 400 && /maksimal/.test(r.json.error ?? ""), "ucapan > 500 karakter ditolak");
  r = await post(inv.slug, { name: "", message: "tanpa nama" });
  check(r.status === 400, "tanpa nama ditolak");
  const same = nextIp();
  const sameDev = newDevice();
  const a1 = await post(
    inv.slug,
    { name: "Dobel", message: "Ucapan yang sama persis" },
    same,
    sameDev,
  );
  const a2 = await post(
    inv.slug,
    { name: "Dobel", message: "Ucapan yang sama persis" },
    same,
    sameDev,
  );
  check(
    a1.status === 200 &&
      a2.status === 200 &&
      (await db.wish.count({
        where: { invitationId: inv.id, message: "Ucapan yang sama persis" },
      })) === 1,
    "kirim ganda → tidak digandakan",
  );
  const RAMAH = "Terlalu banyak ucapan dalam waktu singkat";
  // Batas ketat per PERANGKAT (cookie), dari IP berbeda-beda sekalipun.
  const dev = newDevice();
  const codes: number[] = [];
  let last = r;
  for (let i = 0; i < 7; i++) {
    last = await post(inv.slug, { name: `Spam ${i}`, message: `pesan ke-${i}` }, nextIp(), dev);
    codes.push(last.status);
  }
  check(
    codes.slice(0, 5).every((c) => c === 200) && codes[5] === 429,
    `satu perangkat: kiriman ke-6 dalam 10 menit ditolak (${codes.join(",")})`,
  );
  check(
    !!last.json.rateLimited && (last.json.error ?? "").includes(RAMAH),
    `pesan ramah: "${last.json.error}"`,
  );
  // Tanpa cookie: kiriman tanpa cookie dari IP yang sama berbagi batas perangkat.
  const noCookieIp = nextIp();
  const nc: number[] = [];
  for (let i = 0; i < 6; i++) {
    const x = await post(inv.slug, { name: `Tanpa ${i}`, message: `tc ${i}` }, noCookieIp, null);
    nc.push(x.status);
    if (i === 0)
      check(
        /udk_dev=[a-f0-9]{32}/.test(x.setCookie ?? ""),
        "tanpa cookie → API memberi cookie perangkat baru",
      );
  }
  check(nc[4] === 200 && nc[5] === 429, `tanpa cookie dari 1 IP: ke-6 ditolak (${nc.join(",")})`);

  console.log("CGNAT / Wi-Fi gedung (banyak tamu, satu IP)");
  const cg = await invitation(owner.id, "uji-cgnat", "WEDDING", "renda-rimba");
  const cgIp = "198.51.100.7";
  const t0 = Date.now();
  const cgCodes = await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      post(
        cg.slug,
        { name: `Tamu Gedung ${i}`, attendance: "HADIR", message: `Selamat ${i}` },
        cgIp,
      ).then((x) => x.status),
    ),
  );
  const secs = (Date.now() - t0) / 1000;
  check(
    cgCodes.every((c) => c === 200) && secs < 60,
    `50 tamu berbeda (cookie berbeda) dari IP yang sama dalam ${secs.toFixed(1)} dtk → ${cgCodes.filter((c) => c === 200).length}/50 berhasil`,
  );
  check(
    (await db.wish.count({ where: { invitationId: cg.id } })) === 50 &&
      (await db.rsvp.count({ where: { invitationId: cg.id } })) === 50,
    "50 ucapan + 50 konfirmasi tersimpan",
  );
  // Batas IP longgar (100 / undangan / 10 menit) tetap menahan serangan massal.
  const more: number[] = [];
  for (let i = 0; i < 52; i++)
    more.push((await post(cg.slug, { name: `Massal ${i}`, message: `m ${i}` }, cgIp)).status);
  const okMore = more.filter((c) => c === 200).length;
  check(
    okMore === 50 && more.at(-1) === 429,
    `satu IP: kiriman ke-101 dalam 10 menit ditolak (${50 + okMore} diterima)`,
  );

  console.log("Batas per undangan (banjir dari banyak IP)");
  await db.wish.deleteMany({ where: { invitationId: cg.id } });
  await db.rsvp.deleteMany({ where: { invitationId: cg.id } });
  // berurutan: batas dihitung dari baris DB (best-effort, bukan transaksi)
  const flood = async (slug: string, n: number) => {
    const out: number[] = [];
    for (let i = 0; i < n; i++)
      out.push((await post(slug, { name: `Banjir ${i}`, message: `b ${i}` })).status);
    return out;
  };
  const basicFlood = await flood(cg.slug, 130);
  const basicOk = basicFlood.filter((c) => c === 200).length;
  check(basicOk === 120, `BASIC: maks 120 kiriman / menit (${basicOk} diterima dari 130)`);
  const prem = await invitation(
    owner.id,
    "uji-cgnat-premium",
    "WEDDING",
    "renda-rimba",
    "PUBLISHED",
    "PREMIUM",
  );
  const premFlood = await flood(prem.slug, 200);
  check(
    premFlood.every((c) => c === 200),
    `PREMIUM: 200 kiriman / menit dari banyak tamu diterima (${premFlood.filter((c) => c === 200).length}/200)`,
  );

  r = await post(draft.slug, { name: "X", message: "draf" });
  check(r.status === 404, "undangan draf/tidak aktif → 404");

  console.log("Moderasi pemilik");
  const token = await encode({
    token: { sub: owner.id, id: owner.id, name: "Uji A", email: owner.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const ed = await browser.newPage();
  await ed.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await ed.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await ed.goto(`${base}/dashboard/undangan/${inv.id}/edit`, { waitUntil: "networkidle0" });
  await ed.evaluate(
    `[...document.querySelectorAll("button[aria-expanded]")].find((b) => b.textContent.includes("RSVP & ucapan tamu"))?.click()`,
  );
  await ed.waitForFunction(`document.body.innerText.includes("Ucapan (")`, { timeout: 15000 });
  const panel = await text(ed);
  check(
    /Hadir/.test(panel) && /Konfirmasi \(\d+\)/.test(panel),
    "panel rekap Hadir / Tidak hadir / Ragu + jumlah orang",
  );
  await ed.evaluate(`document.querySelector('[aria-label="Rekap kehadiran"]')?.scrollIntoView()`);
  if (shots) await ed.screenshot({ path: `${shots}/3-editor-rekap.png` });
  const target = await db.wish.findFirst({ where: { invitationId: inv.id, name: "Bu Siti" } });
  await ed.waitForSelector(`[data-wish-id="${target!.id}"] button:not([disabled])`);
  await ed.evaluate(
    `[...document.querySelectorAll('[data-wish-id="${target!.id}"] button')].find((b) => b.textContent === "Sembunyikan").click()`,
  );
  await sleep(1500);
  const pub = (await (await fetch(`${base}/api/u/${inv.slug}/wishes`)).json()) as {
    wishes: { id: string }[];
  };
  check(
    (await db.wish.findUnique({ where: { id: target!.id } }))?.isHidden === true &&
      !pub.wishes.some((w) => w.id === target!.id),
    "sembunyikan → hilang dari halaman publik",
  );
  if (shots) await ed.screenshot({ path: `${shots}/4-editor-moderasi.png` });
  await ed.waitForSelector(`[data-wish-id="${target!.id}"] button:not([disabled])`);
  await ed.evaluate(
    `[...document.querySelectorAll('[data-wish-id="${target!.id}"] button')].find((b) => b.textContent === "Tampilkan").click()`,
  );
  await sleep(1500);
  check(
    (await db.wish.findUnique({ where: { id: target!.id } }))?.isHidden === false,
    "tampilkan lagi",
  );
  ed.on("dialog", (d) => void d.accept());
  await ed.waitForSelector(`[data-wish-id="${target!.id}"] button:not([disabled])`);
  await ed.evaluate(
    `[...document.querySelectorAll('[data-wish-id="${target!.id}"] button')].find((b) => b.textContent === "Hapus").click()`,
  );
  await sleep(1500);
  check(!(await db.wish.findUnique({ where: { id: target!.id } })), "hapus ucapan");

  console.log("Section bawaan (Confetti Party)");
  const kid = await ctxA.newPage();
  await kid.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await kid.goto(`${base}/${bday.slug}`, { waitUntil: "networkidle0" });
  await kid.waitForSelector("[data-inv-ready]");
  await kid.evaluate(
    `[...document.querySelectorAll("button")].find((b) => /Buka Undangan/i.test(b.textContent))?.click()`,
  );
  await sleep(4000);
  await kid.evaluate(`document.getElementById("inv-rsvp")?.scrollIntoView()`);
  await kid.type("#inv-rsvp input", "Tante Mira");
  await kid.evaluate(
    `[...document.querySelectorAll("#inv-rsvp button")].find((b) => b.textContent.includes("Kirim"))?.click()`,
  );
  await sleep(2000);
  check(
    (await db.rsvp.count({ where: { invitationId: bday.id, name: "Tante Mira" } })) === 1,
    "RSVP section bawaan tersimpan",
  );
  await kid.evaluate(`document.getElementById("inv-ucapan")?.scrollIntoView()`);
  await kid.type("#inv-ucapan input", "Om Budi");
  await kid.type("#inv-ucapan textarea", "Selamat ulang tahun Aira, sehat selalu!");
  await kid.evaluate(
    `[...document.querySelectorAll("#inv-ucapan button")].find((b) => b.textContent.includes("Kirim"))?.click()`,
  );
  await sleep(2000);
  check(
    (await db.wish.count({ where: { invitationId: bday.id, name: "Om Budi" } })) === 1,
    "ucapan section bawaan tersimpan",
  );
  if (shots) await kid.screenshot({ path: `${shots}/5-confetti-ucapan.png` });

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
