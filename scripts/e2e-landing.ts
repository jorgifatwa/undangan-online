/**
 * Uji end-to-end landing page & halaman publik — development / production.
 *
 *   pnpm e2e:landing [base-url] [--shots=.reference/report/landing]
 *
 *  - akses tanpa login; /dashboard tetap wajib login; header berganti "Dashboard"
 *  - SEO: landing TIDAK noindex, metadata & JSON-LD, sitemap, robots;
 *    halaman undangan tetap noindex
 *  - demo: nama yang diketik tampil di cover tema asli (iframe), ganti tema
 *  - showcase filter, tab harga, FAQ, testimoni tersembunyi, kontak kosong tidak tampil
 *  - video hero (dan tidak diputar bila prefers-reduced-motion)
 */
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Frame, Page } from "puppeteer-core";

import { launchBrowser } from "./lib/browser";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};
const text = (p: Page | Frame) => p.evaluate("document.body.innerText") as Promise<string>;
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

/** Gulir pelan sampai bawah agar semua animasi muncul & gambar malas dimuat. */
async function scrollThrough(p: Page) {
  const h = (await p.evaluate("document.documentElement.scrollHeight")) as number;
  for (let y = 0; y < h; y += 500) {
    await p.evaluate(`window.scrollTo(0, ${y})`);
    await sleep(120);
  }
  await sleep(800);
}

async function main() {
  const browser = await launchBrowser();

  console.log("Akses tanpa login");
  for (const path of ["/", "/harga", "/tema", "/tentang", "/syarat", "/privasi"]) {
    const r = await fetch(`${base}${path}`, { redirect: "manual" });
    const body = await r.text();
    check(r.status === 200, `${path} → ${r.status}`);
    check(
      !/permanen/i.test(body.replace(/<script[\s\S]*?<\/script>/g, "")),
      `${path}: tidak memakai kata "permanen"`,
    );
  }
  const dash = await fetch(`${base}/dashboard`, { redirect: "manual" });
  check(
    dash.status === 307 && /\/masuk/.test(dash.headers.get("location") ?? ""),
    "/dashboard tanpa login → /masuk",
  );

  console.log("SEO");
  const home = await fetch(`${base}/`);
  const html = await home.text();
  check(!home.headers.get("x-robots-tag"), "landing: tanpa header X-Robots-Tag");
  check(!/<meta name="robots"[^>]*noindex/.test(html), "landing: tanpa meta noindex");
  check(
    /<title>[^<]*Undangan Pernikahan Online/i.test(html),
    "title memuat “undangan pernikahan online”",
  );
  check(
    /<meta name="description" content="[^"]*undangan ulang tahun online/i.test(html),
    "description memuat “undangan ulang tahun online”",
  );
  check(/<h1[^>]*>[\s\S]*?<\/h1>/.test(html), "ada satu H1");
  check(
    /<meta property="og:image" content="[^"]*\/opengraph-image/.test(html),
    "og:image khusus landing",
  );
  const ld = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].flatMap((m) => JSON.parse(m[1]));
  check(
    ld.some((x: { "@type": string }) => x["@type"] === "FAQPage") &&
      ld.some((x: { "@type": string }) => x["@type"] === "Organization"),
    "JSON-LD: Organization, WebSite, FAQPage",
  );
  const og = await fetch(`${base}/opengraph-image`);
  const ogBuf = Buffer.from(await og.arrayBuffer());
  check(
    og.status === 200 &&
      og.headers.get("content-type") === "image/jpeg" &&
      ogBuf.length < 300 * 1024,
    `gambar pratinjau landing ${Math.round(ogBuf.length / 1024)} KB`,
  );
  const sm = await (await fetch(`${base}/sitemap.xml`)).text();
  check(
    ["/tema", "/harga", "/tentang", "/syarat", "/privasi"].every((p) => sm.includes(p)) &&
      !/preview|perf-|dashboard/.test(sm),
    "sitemap: hanya halaman publik",
  );
  const rb = await (await fetch(`${base}/robots.txt`)).text();
  check(
    /Disallow: \/dashboard/.test(rb) && /Disallow: \/preview\//.test(rb) && /Sitemap: /.test(rb),
    "robots.txt: blokir dashboard & preview, cantumkan sitemap",
  );
  const inv = await fetch(`${base}/perf-renda-rimba`);
  check(/noindex/.test(inv.headers.get("x-robots-tag") ?? ""), "halaman undangan tetap noindex");
  for (const p of ["/syarat", "/privasi"]) {
    const b = await (await fetch(`${base}${p}`)).text();
    check(
      b.includes("data-legal-draft") && b.includes("perlu ditinjau ahli hukum"),
      `${p}: ditandai DRAF perlu ditinjau ahli hukum`,
    );
  }

  console.log("Landing (mobile)");
  const ctx = await browser.createBrowserContext();
  const m = await ctx.newPage();
  await m.setViewport(MOBILE);
  await m.goto(`${base}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await sleep(1500);
  const t0 = await text(m);
  check(
    t0.includes("Masuk") && t0.includes("Buat Gratis"),
    "header belum login: Masuk + Buat Undangan Gratis",
  );
  const video = await m.waitForSelector("video[data-playing]", { timeout: 15000 }).then(
    () => true,
    () => false,
  );
  check(video, "video hero diputar setelah halaman dimuat");
  if (shots) await m.screenshot({ path: `${shots}/m-1-hero.png` });

  // Demo
  await m.evaluate(`document.getElementById("demo").scrollIntoView()`);
  const frameReady = async () => {
    for (let i = 0; i < 60; i++) {
      const f = m.frames().find((x) => x.url().includes("demo=1"));
      if (f && (await f.$("[data-inv-ready]").catch(() => null))) return f;
      await sleep(500);
    }
    return null;
  };
  let f = await frameReady();
  check(!!f, "demo: iframe tema dimuat saat mendekati layar");
  await sleep(1200);
  await m.type("#demo-primary", "Laras");
  await m.type("#demo-secondary", "Bima");
  await sleep(1500);
  check(
    !!f && (await text(f)).includes("Laras") && (await text(f)).includes("Bima"),
    "demo: nama yang diketik tampil di cover tema asli",
  );
  await m.evaluate(`document.querySelector("#demo-primary").scrollIntoView({block:"start"})`);
  await m.evaluate("window.scrollBy(0,-90)");
  await sleep(500);
  if (shots) await m.screenshot({ path: `${shots}/m-2-demo.png` });
  await m.evaluate(
    `[...document.querySelectorAll('[role="radio"]')].find((b)=>b.textContent.includes("Confetti"))?.click()`,
  );
  await sleep(500);
  check(!(await m.$("#demo-secondary")), "demo ulang tahun: hanya satu isian nama");
  f = await frameReady();
  await sleep(1000);
  await m.click("#demo-primary", { count: 3 });
  await m.type("#demo-primary", "Aira");
  await sleep(1500);
  check(
    !!f && f.url().includes("confetti-party") && (await text(f)).includes("Aira"),
    "demo: ganti tema (Confetti) + nama tampil",
  );

  // Showcase filter
  await m.evaluate(`document.getElementById("tema").scrollIntoView()`);
  await sleep(400);
  const cards = () =>
    m.$$eval("[data-theme-card]", (els) => els.map((e) => e.getAttribute("data-theme-card")));
  const all = await cards();
  await m.evaluate(
    `[...document.querySelectorAll('#tema [role="tab"]')].find((b)=>b.textContent.trim()==="Ulang tahun")?.click()`,
  );
  await sleep(300);
  const bday = await cards();
  check(
    all.length >= 3 && bday.length === 1 && bday[0] === "confetti-party",
    `filter tema: ${all.length} → ulang tahun ${bday.join(",")}`,
  );
  check(!!(await m.$('a[href="/preview/confetti-party"]')), "tombol “Coba tema ini” ke /preview");

  // Harga
  await m.evaluate(`document.getElementById("harga").scrollIntoView()`);
  await sleep(400);
  const priceText = await m.$eval("#harga", (e) => (e as HTMLElement).innerText);
  check(
    priceText.includes("Paling populer") &&
      priceText.includes("Rp69.000") &&
      priceText.includes("Aktif 12 bulan setelah acara"),
    "harga pernikahan dari packages.ts + Premium ditonjolkan",
  );
  if (shots) await m.screenshot({ path: `${shots}/m-3-harga.png` });
  await m.evaluate(
    `[...document.querySelectorAll('#harga [role="tab"]')].find((b)=>b.textContent.trim()==="Ulang tahun")?.click()`,
  );
  await sleep(300);
  const bt = await m.$eval("#harga", (e) => (e as HTMLElement).innerText);
  check(
    bt.includes("Rp39.000") && /Exclusive[\s\S]*Segera hadir/.test(bt),
    "tab ulang tahun: harga ulang tahun, Exclusive “Segera hadir”",
  );

  // FAQ & lainnya
  const faq = await m.$$eval("#faq details", (els) => els.length);
  const all2 = await text(m);
  check(
    faq >= 7 &&
      ((await m.$eval("#faq", (e) => e.textContent ?? "")) as string).includes(
        "12 bulan setelah tanggal acara",
      ),
    `FAQ ${faq} pertanyaan, masa aktif 12 bulan`,
  );
  check(!all2.includes("Dari pengguna kami"), "testimoni tidak tampil (belum ada testimoni asli)");
  check(
    !(await m.$('a[href^="https://wa.me/"]')) && !all2.includes("Hubungi kami"),
    "kontak yang belum diisi tidak ditampilkan",
  );
  await m.evaluate("window.scrollTo(0, 2400)");
  await sleep(600);
  check(
    await m.$eval(
      ".fixed.bottom-0",
      (e) => getComputedStyle(e).transform === "none" || e.className.includes("translate-y-0"),
    ),
    "HP: tombol CTA menempel setelah hero",
  );
  if (shots) {
    await scrollThrough(m);
    await m.evaluate("window.scrollTo(0,0)");
    await sleep(500);
    await m.screenshot({ path: `${shots}/m-0-landing-full.png`, fullPage: true });
  }
  await ctx.close();

  console.log("Landing (desktop)");
  const d = await browser.newPage();
  await d.setViewport(DESKTOP);
  await d.goto(`${base}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await sleep(1200);
  if (shots) {
    await d.screenshot({ path: `${shots}/d-1-hero.png` });
    await scrollThrough(d);
    await d.evaluate("window.scrollTo(0,0)");
    await sleep(500);
    await d.screenshot({ path: `${shots}/d-0-landing-full.png`, fullPage: true });
    for (const p of ["harga", "tentang", "syarat", "privasi"]) {
      await d.goto(`${base}/${p}`, { waitUntil: "networkidle0" });
      await scrollThrough(d);
      await d.evaluate("window.scrollTo(0,0)");
      await sleep(300);
      await d.screenshot({ path: `${shots}/d-${p}.png`, fullPage: true });
    }
  }

  console.log("Gerak dikurangi");
  const r = await browser.newPage();
  await r.setViewport(MOBILE);
  await r.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await r.goto(`${base}/`, { waitUntil: "networkidle0" });
  await sleep(2500);
  check(!(await r.$("video")), "prefers-reduced-motion: video tidak dimuat (gambar diam)");
  const hidden = await r.$$eval(
    "[data-reveal]",
    (els) => els.filter((e) => getComputedStyle(e).opacity === "0").length,
  );
  check(hidden === 0, "prefers-reduced-motion: semua konten langsung terlihat");

  console.log("Sudah login");
  const db = new PrismaClient();
  const u = await db.user.upsert({
    where: { email: "e2e-a@test.local" },
    update: {},
    create: { email: "e2e-a@test.local", name: "Uji A" },
  });
  await db.$disconnect();
  const token = await encode({
    token: { sub: u.id, id: u.id, name: "Uji A", email: u.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const li = await browser.newPage();
  await li.setViewport(MOBILE);
  await li.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await li.goto(`${base}/`, { waitUntil: "networkidle0" });
  const dashBtn = await li
    .waitForFunction(
      `[...document.querySelectorAll("header a")].some((a)=>a.textContent.trim()==="Dashboard")`,
      { timeout: 10000 },
    )
    .then(
      () => true,
      () => false,
    );
  check(dashBtn, "header sudah login: tombol “Dashboard”");
  check(
    !(await li.evaluate(
      `[...document.querySelectorAll("header a")].some((a)=>a.textContent.trim()==="Masuk")`,
    )),
    "header sudah login: tanpa “Masuk”",
  );

  await browser.close();
  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
