/**
 * Uji pengaman ANTI-PENIPUAN (berlaku untuk semua undangan).
 *
 *   pnpm dev
 *   pnpm e2e:safety [base-url] [--shots=.reference/report/harga-tema]
 *
 *  1. Teks bebas (pembuka, love story, penutup, dress code, …) TIDAK pernah
 *     dirender sebagai link — URL tampil sebagai teks biasa (3 tema)
 *  2. Kolom link hanya domain tepercaya: Google Maps (lokasi); YouTube, Zoom,
 *     Google Meet, Instagram (siaran); Instagram (akun mempelai). Ditolak di
 *     browser (editor) DAN server; data lama dengan link asing tetap tampil
 *     tanpa link tersebut
 *  3. Hanya foto & musik yang bisa diunggah
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { requestUpload, UploadError } from "../src/lib/media/service";
import { parseInvitationData } from "../src/schemas";
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

const SCAM = {
  opening: "Mohon transfer dulu ke https://transfer-hadiah.xyz/bayar sebelum datang.",
  story: "Kami bertemu lewat www.hadiah-palsu.id dan langsung cocok.",
  closing: "Konfirmasi kehadiran di bit.ly/konfirmasi-palsu ya!",
  dress: "Info lengkap: https://dresscode-palsu.com",
};
const BAD_HOSTS = ["transfer-hadiah", "hadiah-palsu", "bit.ly", "dresscode-palsu", "evil.example"];

async function owner() {
  return db.user.upsert({
    where: { email: "e2e-a@test.local" },
    update: {},
    create: { email: "e2e-a@test.local", name: "Uji A" },
  });
}

function weddingData(themeId: string) {
  const d = buildInitialData({
    eventType: "WEDDING",
    brideName: "Laras Ayu",
    brideNickname: "Laras",
    groomName: "Bima Satria",
    groomNickname: "Bima",
    date: new Date(Date.now() + 50 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Bandung",
    greeting: "umum",
    themeId,
  }).data as Record<string, unknown>;
  const events = (d.events as Record<string, unknown>[]).map((e) => ({
    ...e,
    venueName: "Gedung Uji",
    address: "Jl. Uji No. 1",
    mapsUrl: "https://maps.app.goo.gl/UjiLokasi",
  }));
  return {
    ...d,
    events,
    greeting: { style: "umum", openingText: SCAM.opening, closingText: SCAM.closing },
    loveStory: [{ date: "2020", title: "Pertama bertemu", text: SCAM.story }],
    dressCode: { text: SCAM.dress, colors: [] },
    bride: { ...(d.bride as object), instagram: "laras.ayu" },
    liveStream: { url: "https://www.youtube.com/live/uji123", platform: "YouTube" },
  };
}

async function publishedInvitation(slug: string, themeId: string, data: unknown) {
  const u = await owner();
  await db.invitation.deleteMany({ where: { slug } });
  return db.invitation.create({
    data: {
      userId: u.id,
      slug,
      eventType: "WEDDING",
      themeId,
      status: "PUBLISHED",
      publishedAt: new Date(),
      ...purchased(themeId),
      data: data as Prisma.InputJsonValue,
    },
  });
}

/** Buka undangan, buka cover, gulir sampai bawah agar semua section dirender. */
async function openAll(p: Page, url: string) {
  await p.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await p.waitForSelector("[data-inv-ready]");
  await sleep(1500);
  await p.evaluate(`(document.querySelector('[aria-label="Buka undangan"]') ||
    [...document.querySelectorAll("button")].find((b) => /buka undangan/i.test(b.textContent)))?.click()`);
  await sleep(3000);
  const h = (await p.evaluate("document.documentElement.scrollHeight")) as number;
  for (let y = 0; y < h; y += 500) {
    await p.evaluate(`window.scrollTo(0, ${y})`);
    await sleep(120);
  }
  await sleep(1500);
}

const links = (p: Page) =>
  p.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href)) as Promise<string[]>;

async function main() {
  assertSafeDatabase("e2e-safety");
  const browser = await launchBrowser();

  console.log("1. Teks bebas tidak pernah menjadi link");
  for (const themeId of ["renda-rimba", "tirai-beludru"]) {
    const inv = await publishedInvitation(`uji-aman-${themeId}`, themeId, weddingData(themeId));
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await openAll(p, `${base}/${inv.slug}`);
    const hrefs = await links(p);
    const body = (await p.evaluate("document.body.textContent")) as string;
    check(
      !hrefs.some((h) => BAD_HOSTS.some((b) => h.includes(b))),
      `${themeId}: tidak ada link ke domain dari teks bebas (${hrefs.length} link di halaman)`,
    );
    check(
      body.includes("transfer-hadiah.xyz") && body.includes("hadiah-palsu.id"),
      `${themeId}: URL di teks bebas tampil sebagai teks biasa`,
    );
    check(
      hrefs.some((h) => h.startsWith("https://maps.app.goo.gl/")) &&
        hrefs.some((h) => h.startsWith("https://www.youtube.com/live/")) &&
        hrefs.some((h) => h === "https://instagram.com/laras.ayu"),
      `${themeId}: link tepercaya (Maps, YouTube, Instagram) tetap berfungsi`,
    );
    if (shots && themeId === "renda-rimba") {
      await p.evaluate(
        `[...document.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.includes("transfer-hadiah"))?.scrollIntoView({ block: "center" })`,
      );
      await sleep(800);
      await p.screenshot({ path: `${shots}/aman-1-teks-bebas.png` });
    }
    await ctx.close();
  }

  {
    // Pita Krayon (ulang tahun): teks bebas + wishlist (toko tepercaya saja)
    const bd = buildInitialData({
      eventType: "BIRTHDAY",
      name: "Aira Salsabila",
      nickname: "Aira",
      age: 6,
      date: new Date(Date.now() + 40 * DAY).toISOString().slice(0, 10),
      timezone: "WIB",
      city: "Depok",
      themeId: "pita-krayon",
    }).data as Record<string, unknown>;
    const data = {
      ...bd,
      greeting: { style: "umum", openingText: SCAM.opening, closingText: SCAM.closing },
      wishlist: [
        { name: "Boneka", url: "https://www.tokopedia.com/toko/boneka" },
        { name: "Sepeda", note: "Info di https://transfer-hadiah.xyz" },
      ],
    };
    const u0 = await owner();
    await db.invitation.deleteMany({ where: { slug: "uji-aman-confetti" } });
    const inv = await db.invitation.create({
      data: {
        userId: u0.id,
        slug: "uji-aman-confetti",
        eventType: "BIRTHDAY",
        themeId: "pita-krayon",
        status: "PUBLISHED",
        publishedAt: new Date(),
        ...purchased("pita-krayon"),
        data: data as Prisma.InputJsonValue,
      },
    });
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await openAll(p, `${base}/${inv.slug}`);
    const hrefs = await links(p);
    check(
      !hrefs.some((h) => BAD_HOSTS.some((b) => h.includes(b))) &&
        ((await p.evaluate("document.body.textContent")) as string).includes("transfer-hadiah.xyz"),
      "pita-krayon: URL di teks bebas tampil sebagai teks, bukan link",
    );
    check(
      hrefs.some((h) => h.startsWith("https://www.tokopedia.com/")),
      "pita-krayon: link toko tepercaya tetap berfungsi",
    );
    await ctx.close();
    const wl = parseInvitationData(
      "BIRTHDAY",
      { ...data, wishlist: [{ name: "Hadiah", url: "https://transfer-hadiah.xyz/beli" }] },
      { strict: true },
    );
    check(!wl.ok, "wishlist dengan link toko tak dikenal → ditolak");
  }

  console.log("2. Kolom link: hanya domain tepercaya (server)");
  const bad = (patch: (d: Record<string, unknown>) => void) => {
    const d = weddingData("renda-rimba") as Record<string, unknown>;
    patch(d);
    return parseInvitationData("WEDDING", d, { strict: true });
  };
  const maps = bad(
    (d) => ((d.events as Record<string, unknown>[])[0].mapsUrl = "https://evil.example/peta"),
  );
  check(
    !maps.ok && JSON.stringify(maps.error).includes("Link harus dari Google Maps"),
    "lokasi bukan Google Maps → ditolak",
  );
  const sites = bad(
    (d) =>
      ((d.events as Record<string, unknown>[])[0].mapsUrl =
        "https://sites.google.com/view/transfer"),
  );
  check(!sites.ok, "sites.google.com (bukan peta) → ditolak");
  const ls = bad((d) => (d.liveStream = { url: "https://wa.me/628123456789" }));
  check(
    !ls.ok && JSON.stringify(ls.error).includes("YouTube, Zoom, Google Meet, atau Instagram"),
    "siaran langsung bukan YouTube/Zoom/Meet/Instagram → ditolak",
  );
  for (const okUrl of [
    "https://zoom.us/j/123",
    "https://meet.google.com/abc-defg-hij",
    "https://www.instagram.com/laras.ayu/live",
  ]) {
    const r = bad((d) => (d.liveStream = { url: okUrl }));
    check(r.ok, `siaran ${new URL(okUrl).hostname} → diterima`);
  }
  const ig = bad(
    (d) => ((d.bride as Record<string, unknown>).instagram = "https://evil.example/x"),
  );
  check(!ig.ok, "akun Instagram berupa link situs lain → ditolak");
  const igOk = bad(
    (d) =>
      ((d.groom as Record<string, unknown>).instagram = "https://www.instagram.com/bima.satria/"),
  );
  check(
    igOk.ok &&
      igOk.value.eventType === "WEDDING" &&
      igOk.value.data.groom.instagram === "bima.satria",
    "link instagram.com dinormalkan jadi nama akun",
  );

  console.log("   data lama dengan link asing (sebelum aturan ini) tetap tampil tanpa link itu");
  const legacy = weddingData("renda-rimba") as Record<string, unknown>;
  (legacy.events as Record<string, unknown>[])[0].mapsUrl = "https://evil.example/peta-lama";
  legacy.liveStream = { url: "https://evil.example/live" };
  const old = await publishedInvitation("uji-aman-lama", "renda-rimba", legacy);
  const lenient = parseInvitationData("WEDDING", legacy);
  check(
    lenient.ok &&
      lenient.value.eventType === "WEDDING" &&
      !lenient.value.data.events[0].mapsUrl &&
      !lenient.value.data.liveStream,
    "server: link asing dibuang, data lain utuh",
  );
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const res = await p.goto(`${base}/${old.slug}`, { waitUntil: "networkidle0" });
    check(res?.status() === 200, "undangan lama tetap tampil (bukan 404)");
    await openAll(p, `${base}/${old.slug}`);
    check(
      !(await links(p)).some((h) => h.includes("evil.example")),
      "halaman tamu: tidak ada link ke domain asing",
    );
    await ctx.close();
  }

  console.log("   editor (browser): link asing ditolak sebelum tersimpan");
  const u = await owner();
  const draft = await publishedInvitation(
    "uji-aman-editor",
    "renda-rimba",
    weddingData("renda-rimba"),
  );
  const token = await encode({
    token: { sub: u.id, id: u.id, name: "Uji A", email: u.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const ed = await browser.newPage();
  await ed.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await ed.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await ed.goto(`${base}/dashboard/undangan/${draft.id}/edit`, {
    waitUntil: "networkidle0",
    timeout: 90000,
  });
  await ed.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Acara"))?.click()`,
  );
  await sleep(500);
  await ed.click("#f-events-0-mapsUrl", { count: 3 });
  await ed.keyboard.press("Backspace");
  await ed.type("#f-events-0-mapsUrl", "https://evil.example/peta");
  await ed.click("#f-events-0-venueName");
  const msg = await ed
    .waitForFunction(`document.body.innerText.includes("Link harus dari Google Maps")`, {
      timeout: 8000,
    })
    .then(
      () => true,
      () => false,
    );
  check(msg, "editor: pesan “Link harus dari Google Maps”");
  await sleep(3000);
  const saved = await db.invitation.findUniqueOrThrow({ where: { id: draft.id } });
  check(
    JSON.stringify(saved.data).includes("maps.app.goo.gl/UjiLokasi") &&
      !JSON.stringify(saved.data).includes("evil.example"),
    "link asing tidak tersimpan (data tetap link lama)",
  );
  if (shots) {
    await ed.evaluate(
      `document.getElementById("f-events-0-mapsUrl")?.scrollIntoView({ block: "center" })`,
    );
    await sleep(400);
    await ed.screenshot({ path: `${shots}/aman-2-link-ditolak.png` });
  }

  console.log("3. Hanya foto & musik yang bisa diunggah");
  const tryUpload = (req: Parameters<typeof requestUpload>[2]) =>
    requestUpload(u.id, draft.id, req).then(
      () => null,
      (e: unknown) => e,
    );
  for (const [label, req] of [
    ["video", { kind: "VIDEO" as never, slot: "music", contentType: "video/mp4", size: 1000 }],
    ["dokumen PDF", { kind: "PHOTO", slot: "gallery", contentType: "application/pdf", size: 1000 }],
    ["halaman HTML", { kind: "PHOTO", slot: "gallery", contentType: "text/html", size: 1000 }],
    ["SVG", { kind: "PHOTO", slot: "gallery", contentType: "image/svg+xml", size: 1000 }],
    [
      "file .exe sebagai musik",
      {
        kind: "AUDIO",
        slot: "music",
        contentType: "application/octet-stream",
        size: 1000,
        rightsAccepted: true,
      },
    ],
  ] as const) {
    const e = await tryUpload(req as Parameters<typeof requestUpload>[2]);
    check(e instanceof UploadError, `${label} → ditolak`);
  }
  const okPhoto = await tryUpload({
    kind: "PHOTO",
    slot: "gallery",
    contentType: "image/jpeg",
    size: 1000,
  });
  check(okPhoto === null, "foto JPG → diterima (isi file tetap dicek saat diproses)");
  await db.media.deleteMany({ where: { invitationId: draft.id } });

  await browser.close();
  for (const s of [
    "uji-aman-renda-rimba",
    "uji-aman-tirai-beludru",
    "uji-aman-confetti",
    "uji-aman-lama",
    "uji-aman-editor",
  ])
    await db.invitation.deleteMany({ where: { slug: s } });
  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
