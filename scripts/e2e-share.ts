/**
 * Uji end-to-end Bagikan (4c) & URL undangan di root — development.
 *
 *   pnpm dev
 *   pnpm e2e:share [base-url] [--shots=.reference/report/4c]
 *
 *  - metadata pratinjau link (og:title/description/image, ?to=) + noindex
 *  - gambar /og: JPEG 1200×630 < 300 KB, versi berubah saat undangan diubah,
 *    kedaluwarsa → tanpa data pribadi, draf → 404
 *  - URL undangan di root /{slug}; tautan lama /u/{slug} → 301; rute website aman
 *  - dialog Bagikan: link ?to=, nomor WA, template tersimpan (updatedAt tetap)
 */
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Page } from "puppeteer-core";
import sharp from "sharp";

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

/** GET dengan header Host bebas (fetch tidak mengizinkan Host). */
function get(path: string, host?: string, headers: Record<string, string> = {}) {
  const u = new URL(path, base);
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>(
    (resolve, reject) => {
      const req = http.get(
        {
          hostname: u.hostname,
          port: u.port,
          path: `${u.pathname}${u.search}`,
          headers: { ...headers, host: host ?? u.host },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: Buffer.concat(chunks),
            }),
          );
        },
      );
      req.on("error", reject);
    },
  );
}
const meta = (html: string, key: string) =>
  html
    .match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]
    ?.replace(/&amp;/g, "&");

async function main() {
  assertSafeDatabase("e2e-share");
  const owner = await db.user.upsert({
    where: { email: "e2e-a@test.local" },
    update: {},
    create: { email: "e2e-a@test.local", name: "Uji A" },
  });
  const slug = "kirana-galih-bagikan";
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Kirana Ayu",
    brideNickname: "Kirana",
    groomName: "Galih Pratama",
    groomNickname: "Galih",
    date: new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Semarang",
    greeting: "islami",
    quoteId: "ar-rum-21",
    themeId: "renda-rimba",
  }).data;
  const inv = await db.invitation.create({
    data: {
      userId: owner.id,
      slug,
      eventType: "WEDDING",
      themeId: "renda-rimba",
      package: "FREE",
      status: "PUBLISHED",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * DAY),
      data: data as Prisma.InputJsonValue,
    },
  });

  console.log("Metadata pratinjau link");
  const page1 = await get(`/${slug}?to=Bu%20Siti`);
  const html = page1.body.toString();
  const title = meta(html, "og:title");
  const ogImage = meta(html, "og:image") ?? "";
  check(title === "Undangan Pernikahan Kirana & Galih", `og:title "${title}"`);
  check(
    (meta(html, "og:description") ?? "").startsWith("Kepada Bu Siti.") &&
      (meta(html, "og:description") ?? "").includes("Semarang"),
    `og:description "${meta(html, "og:description")}"`,
  );
  check(/\/og\?v=[a-z0-9]+$/.test(ogImage), `og:image ${ogImage}`);
  check(meta(html, "twitter:card") === "summary_large_image", "twitter:card summary_large_image");
  check(/noindex/.test(meta(html, "robots") ?? ""), "meta robots noindex");
  check(
    /noindex/.test(String(page1.headers["x-robots-tag"])),
    `header X-Robots-Tag: ${page1.headers["x-robots-tag"]}`,
  );
  check(
    /udk_dev=[a-f0-9]{32}/.test(String(page1.headers["set-cookie"])),
    "cookie perangkat tamu tetap dibuat",
  );

  console.log("Gambar pratinjau (/og)");
  const ogPath = `/${slug}/og${new URL(ogImage).search}`;
  const og = await get(ogPath);
  const info = await sharp(og.body).metadata();
  check(og.status === 200 && og.headers["content-type"] === "image/jpeg", "200 image/jpeg");
  check(info.width === 1200 && info.height === 630, `ukuran ${info.width}×${info.height}`);
  check(
    og.body.length < 300 * 1024,
    `${Math.round(og.body.length / 1024)} KB (< 300 KB aman untuk WhatsApp)`,
  );
  check(/noindex/.test(String(og.headers["x-robots-tag"])), "X-Robots-Tag di gambar");
  check(!og.headers["set-cookie"], "gambar tanpa Set-Cookie (bisa di-cache CDN)");
  if (shots) await sharp(og.body).toFile(`${shots}/1-og-renda.jpg`);

  await db.invitation.update({
    where: { id: inv.id },
    data: {
      data: {
        ...(data as object),
        music: { tracks: [], autoplay: false },
      } as Prisma.InputJsonValue,
    },
  });
  const ogImage2 = meta((await get(`/${slug}`)).body.toString(), "og:image");
  check(!!ogImage2 && ogImage2 !== ogImage, "undangan diubah → URL gambar (versi) berubah");

  await db.invitation.update({
    where: { id: inv.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const exp = (await get(`/${slug}`)).body.toString();
  check(
    !exp.includes("Kirana") && !exp.includes("Galih") && !exp.includes("Semarang"),
    "kedaluwarsa: metadata tanpa nama/kota",
  );
  const expOg = await get(`/${slug}/og`);
  check(expOg.status === 200, "kedaluwarsa: /og memberi gambar umum");
  if (shots) await sharp(expOg.body).toFile(`${shots}/2-og-kedaluwarsa.jpg`);
  await db.invitation.update({
    where: { id: inv.id },
    data: { status: "DRAFT", expiresAt: new Date(Date.now() + 3 * DAY) },
  });
  check((await get(`/${slug}/og`)).status === 404, "draf: /og 404");
  await db.invitation.update({ where: { id: inv.id }, data: { status: "PUBLISHED" } });

  console.log("Foto cover di gambar pratinjau");
  if ((process.env.STORAGE_DRIVER ?? "local") !== "local") {
    console.log("  – STORAGE_DRIVER bukan local (dilewati)");
  } else {
    const photoInv = async (themeId: string, eventType: "WEDDING" | "BIRTHDAY") => {
      const s2 = `og-foto-${themeId}`;
      await db.invitation.deleteMany({ where: { slug: s2 } });
      const date = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
      const d = buildInitialData(
        eventType === "WEDDING"
          ? {
              eventType,
              brideName: "Kirana Ayu",
              brideNickname: "Kirana",
              groomName: "Galih Pratama",
              groomNickname: "Galih",
              date,
              timezone: "WIB",
              city: "Semarang",
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
      ).data as Record<string, unknown>;
      const created = await db.invitation.create({
        data: {
          userId: owner.id,
          slug: s2,
          eventType,
          themeId,
          package: "PREMIUM",
          status: "PUBLISHED",
          publishedAt: new Date(),
          data: d as Prisma.InputJsonValue,
        },
      });
      // Foto contoh berlisensi Unsplash (public/placeholders) disalin ke penyimpanan
      // lokal seolah-olah diunggah pemilik.
      const src = eventType === "WEDDING" ? "wedding-cover.webp" : "birthday-celebrant.webp";
      const key = `invitations/${created.id}/photos/og-uji.webp`;
      await fs.mkdir(path.join(process.cwd(), ".uploads", path.dirname(key)), { recursive: true });
      await fs.copyFile(
        path.join(process.cwd(), "public/placeholders/photos", src),
        path.join(process.cwd(), ".uploads", key),
      );
      const photo = { url: `/media/${key}`, focusX: 50, focusY: 35 };
      const withPhoto =
        eventType === "WEDDING"
          ? { ...d, photos: { ...(d.photos as object), cover: photo } }
          : { ...d, celebrant: { ...(d.celebrant as object), photo } };
      await db.invitation.update({
        where: { id: created.id },
        data: { data: withPhoto as Prisma.InputJsonValue },
      });
      return created;
    };
    for (const [themeId, eventType] of [
      ["renda-rimba", "WEDDING"],
      ["tirai-beludru", "WEDDING"],
      ["confetti-party", "BIRTHDAY"],
    ] as const) {
      const pi = await photoInv(themeId, eventType);
      const r = await get(`/${pi.slug}/og`);
      const text = await get(`/perf-${themeId}/og`);
      const m = await sharp(r.body).metadata();
      check(
        r.status === 200 && m.width === 1200 && m.height === 630 && r.body.length < 150 * 1024,
        `${themeId} + foto: ${m.width}×${m.height}, ${Math.round(r.body.length / 1024)} KB (< 150 KB)`,
      );
      if (text.status === 200)
        check(
          text.body.length < 150 * 1024,
          `${themeId} tanpa foto (versi teks): ${Math.round(text.body.length / 1024)} KB`,
        );
      // panel kiri harus berisi foto (bukan gradien polos): variasi piksel tinggi
      const left = await sharp(r.body)
        .extract({ left: 40, top: 40, width: 380, height: 550 })
        .stats();
      check(
        left.channels[0].stdev > 25,
        `${themeId}: panel kiri berisi foto (stdev ${left.channels[0].stdev.toFixed(0)})`,
      );
      if (shots) await sharp(r.body).toFile(`${shots}/1b-og-foto-${themeId}.jpg`);
      if (themeId === "renda-rimba") {
        await db.invitation.update({
          where: { id: pi.id },
          data: { expiresAt: new Date(Date.now() - 60_000) },
        });
        const ex = await get(`/${pi.slug}/og`);
        check(
          ex.body.equals(expOg.body),
          "kedaluwarsa + foto → gambar umum yang sama persis (tanpa foto & nama)",
        );
      }
    }
  }

  console.log("URL di root & tautan lama /u/");
  const browser = await launchBrowser();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? base).replace(/\/+$/, "");
  const root = await get(`/${slug}?to=Pak%20Budi`);
  const rh = root.body.toString();
  check(
    root.status === 200 && rh.includes("Pak Budi") && rh.includes("Kirana"),
    `/${slug}?to= → undangan`,
  );
  check(
    rh.includes(`<link rel="canonical" href="${appUrl}/${slug}"/>`),
    `canonical & og:url = ${appUrl}/${slug}`,
  );
  check(
    meta(rh, "og:image")?.startsWith(`${appUrl}/${slug}/og?v=`) ?? false,
    `og:image ${meta(rh, "og:image")}`,
  );
  const old = await get(`/u/${slug}?to=Pak%20Budi`);
  check(
    old.status === 301 && old.headers.location === `/${slug}?to=Pak%20Budi`,
    `/u/${slug}?to=… → ${old.status} ${old.headers.location}`,
  );
  const oldOg = await get(`/u/${slug}/og?v=abc`);
  check(
    oldOg.status === 301 && oldOg.headers.location === `/${slug}/og?v=abc`,
    `/u/${slug}/og → ${oldOg.status} ${oldOg.headers.location}`,
  );
  for (const r of ["/harga", "/tema", "/masuk"]) {
    const w = await get(r);
    check(
      w.status === 200 && !w.body.toString().includes("Kirana &amp; Galih"),
      `${r} tetap halaman website (${w.status})`,
    );
  }
  check((await get("/bantuan")).status === 404, "slug terlarang tanpa halaman (/bantuan) → 404");
  check((await get("/Wp-Login")).status === 404, "format bukan slug (/Wp-Login) → 404");
  check(
    !/udk_dev=/.test(String((await get("/harga")).headers["set-cookie"] ?? "")),
    "halaman website tidak diberi cookie perangkat tamu",
  );
  {
    const ctx = await browser.createBrowserContext();
    const g = await ctx.newPage();
    await g.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await g.goto(`${base}/u/${slug}?to=Pak%20Budi`, { waitUntil: "networkidle0", timeout: 90000 });
    await g.waitForSelector("[data-inv-ready]");
    await sleep(1200);
    check(
      g.url() === `${base}/${slug}?to=Pak%20Budi` &&
        ((await g.evaluate("document.body.innerText")) as string).includes("Pak Budi"),
      `browser: tautan lama berakhir di ${g.url().replace(base, "")} dengan nama tamu di sampul`,
    );
    if (shots) await g.screenshot({ path: `${shots}/3-url-root-cover.png` });
    await ctx.close();
  }

  console.log("Dialog Bagikan (editor)");
  const token = await encode({
    token: { sub: owner.id, id: owner.id, name: "Uji A", email: owner.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
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
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  const editUrl = `${base}/dashboard/undangan/${inv.id}/edit`;
  await page.goto(editUrl, { waitUntil: "networkidle0", timeout: 90000 });
  const clickText = (p: Page, t: string) =>
    p.evaluate(
      `[...document.querySelectorAll("button, a")].find((b) => b.textContent.trim() === ${JSON.stringify(t)})?.click()`,
    );
  await clickText(page, "Bagikan");
  await page.waitForSelector("#share-guest");
  const pv = () => page.$eval("[data-share-preview]", (e) => e.textContent ?? "");
  check((await pv()).includes("Bapak/Ibu/Saudara/i"), "tanpa nama → sapaan umum");
  check((await pv()).startsWith("Assalamu'alaikum"), "template bawaan Islami (salam pembuka)");
  await page.type("#share-guest", "Bapak Hadi & Keluarga");
  await sleep(300);
  const link = await page.$eval("[data-share-link]", (e) => e.textContent ?? "");
  check(link === `${appUrl}/${slug}?to=Bapak%20Hadi%20%26%20Keluarga`, `link personal: ${link}`);
  const preview = await pv();
  check(
    preview.includes("Bapak Hadi & Keluarga") &&
      preview.includes(link) &&
      preview.includes("*Kirana & Galih*"),
    "pratinjau pesan: nama tamu, link, nama mempelai",
  );
  let wa = await page.$eval("[data-share-wa]", (e) => e.getAttribute("href") ?? "");
  check(
    wa.startsWith("https://wa.me/?text=") && decodeURIComponent(wa.split("text=")[1]) === preview,
    "tanpa nomor → wa.me/?text=pesan",
  );
  await page.type("#share-phone", "0812-3456-7890");
  await sleep(200);
  wa = await page.$eval("[data-share-wa]", (e) => e.getAttribute("href") ?? "");
  check(wa.startsWith("https://wa.me/6281234567890?text="), "nomor 0812… → wa.me/62812…");
  if (shots) await page.screenshot({ path: `${shots}/4-dialog-bagikan.png` });

  const before = (await db.invitation.findUnique({ where: { id: inv.id } }))!.updatedAt.getTime();
  await page.click("#share-template", { count: 1 });
  await page.evaluate(
    `(() => { const t = document.getElementById("share-template"); t.select(); })()`,
  );
  await page.keyboard.press("Backspace");
  await page.type("#share-template", "Halo ");
  await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent === "{nama_tamu}")?.click()`,
  );
  await sleep(150);
  await page.type("#share-template", ", ini undangan kami ya: ");
  await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent === "{link}")?.click()`,
  );
  await page
    .waitForFunction(`document.body.innerText.includes("Template tersimpan")`, { timeout: 10000 })
    .catch(() => undefined);
  let row = await db.invitation.findUnique({ where: { id: inv.id } });
  check(
    row?.shareTemplate === "Halo {nama_tamu}, ini undangan kami ya: {link}",
    `template tersimpan: "${row?.shareTemplate}"`,
  );
  check(
    row?.updatedAt.getTime() === before,
    "simpan template tidak mengubah updatedAt (tidak memicu konflik autosave)",
  );
  check(
    (await pv()) === `Halo Bapak Hadi & Keluarga, ini undangan kami ya: ${link}`,
    "pratinjau mengikuti template baru",
  );
  if (shots) await page.screenshot({ path: `${shots}/5-template-diubah.png` });

  await page.reload({ waitUntil: "networkidle0" });
  await clickText(page, "Bagikan");
  await page.waitForSelector("#share-template");
  check(
    (await page.$eval("#share-template", (e) => (e as HTMLTextAreaElement).value)) ===
      "Halo {nama_tamu}, ini undangan kami ya: {link}",
    "template tetap ada setelah muat ulang",
  );
  await clickText(page, "Kembalikan ke bawaan");
  await page
    .waitForFunction(`document.body.innerText.includes("Template tersimpan")`, { timeout: 10000 })
    .catch(() => undefined);
  await sleep(300);
  row = await db.invitation.findUnique({ where: { id: inv.id } });
  check(row?.shareTemplate === null, "kembalikan ke bawaan → disimpan sebagai null");
  await page.keyboard.press("Escape");

  console.log("Link tamu dibuka");
  const ctx = await browser.createBrowserContext();
  const g = await ctx.newPage();
  await g.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await g.goto(`${base}/${slug}?to=Bapak%20Hadi%20%26%20Keluarga`, { waitUntil: "networkidle0" });
  await g.waitForSelector("[data-inv-ready]");
  await sleep(1200);
  check(
    ((await g.evaluate("document.body.innerText")) as string).includes("Bapak Hadi & Keluarga"),
    "sampul menampilkan nama tamu dari link",
  );
  if (shots) await g.screenshot({ path: `${shots}/6-tamu-membuka-link.png` });

  console.log("Draf");
  await db.invitation.update({ where: { id: inv.id }, data: { status: "DRAFT" } });
  await page.goto(editUrl, { waitUntil: "networkidle0" });
  const hasShare = await page.evaluate(
    `[...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Bagikan")`,
  );
  check(!hasShare, "draf: tombol Bagikan tidak tampil");

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
