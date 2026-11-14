/**
 * Uji performa tema di kondisi HP kelas bawah:
 *   CPU throttling 4x + jaringan "Fast 4G" (preset Chrome DevTools), cache kosong.
 *
 *   pnpm build && pnpm start -p 3300
 *   pnpm perf http://localhost:3300 [themeId ...]
 *
 * Metrik:
 *   - FCP / LCP           : kapan cover mulai & selesai tampil (target LCP ≤ 2500 ms)
 *   - Siap (inv-ready)    : React selesai hidrasi → tombol "Buka Undangan" bisa diklik
 *   - Frame per fase      : cover diam, membuka cover, scroll seluruh undangan
 *                           → FPS rata-rata, p95 durasi frame, % frame > 50 ms (patah)
 * Tiap tema diuji mode normal & mode ringan (?lite=1).
 */
import type { Page } from "puppeteer-core";

import { THEME_MANIFESTS } from "../src/themes/registry.generated";
import { FAST_4G, launchBrowser, MOBILE_VIEWPORT } from "./lib/browser";

interface FrameStats {
  fps: number;
  p95: number;
  jankPct: number;
}

async function collectFrames(page: Page, action: () => Promise<void>): Promise<FrameStats> {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __rec: boolean };
    w.__frames = [];
    w.__rec = true;
    let last = performance.now();
    const tick = (t: number) => {
      w.__frames.push(t - last);
      last = t;
      if (w.__rec) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await action();
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __rec: boolean };
    w.__rec = false;
    return w.__frames.slice(1);
  });
  if (frames.length === 0) return { fps: 0, p95: 0, jankPct: 0 };
  const total = frames.reduce((a, b) => a + b, 0);
  const sorted = [...frames].sort((a, b) => a - b);
  return {
    fps: Math.round((frames.length / total) * 1000),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
    jankPct: Math.round((frames.filter((f) => f > 50).length / frames.length) * 1000) / 10,
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function measure(base: string, themeId: string, lite: boolean) {
  const browser = await launchBrowser();
  const context = await browser.createBrowserContext(); // cache & storage kosong
  const page = await context.newPage();
  await page.setViewport(MOBILE_VIEWPORT);
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.emulateNetworkConditions(FAST_4G);
  await page.emulateCPUThrottling(4);

  // tsx/esbuild menyisipkan helper __name ke fungsi yang dikirim ke browser.
  await page.evaluateOnNewDocument("window.__name = (fn) => fn;");
  await page.evaluateOnNewDocument(() => {
    const w = window as unknown as { __lcp: number; __lcpEl: string };
    w.__lcp = 0;
    w.__lcpEl = "";
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
        w.__lcp = e.startTime;
        const el = e.element;
        w.__lcpEl = el
          ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} "${(el.textContent ?? "").trim().slice(0, 24)}"`
          : "?";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  // "renda-rimba" → /preview/renda-rimba (data contoh); "/slug" → halaman publik dari DB
  const path = themeId.startsWith("/") ? themeId : `/preview/${themeId}`;
  const url = `${base}${path}?to=Bapak%20Budi${lite ? "&lite=1" : ""}`;
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("[data-inv-ready]", { timeout: 60000 });
  await sleep(1500);

  const vitals = await page.evaluate(() => {
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const ttfb = nav ? nav.responseStart - nav.startTime : 0;
    const ready = performance.getEntriesByName("inv-ready")[0]?.startTime ?? 0;
    const w = window as unknown as { __lcp: number; __lcpEl: string };
    return {
      ttfb: Math.round(ttfb),
      fcp: Math.round(fcp),
      lcp: Math.round(w.__lcp),
      ready: Math.round(ready),
      lcpEl: w.__lcpEl,
    };
  });

  const idle = await collectFrames(page, () => sleep(3000));
  // prepareBehindCover: berapa section sudah dirender di balik cover sebelum diketuk
  const prepared = (await page.evaluate(
    "document.querySelectorAll('main [data-inv-section]').length",
  )) as number;

  const open = await collectFrames(page, async () => {
    // Tombol "Buka Undangan" atau cover ber-aria-label "Buka undangan" (amplop Tirai Beludru).
    // Klik mouse sungguhan (pointerdown → pointerup → click), bukan element.click(),
    // karena runtime bereaksi pada pointerdown (prepareBehindCover).
    const target = await page.evaluateHandle(
      `[...document.querySelectorAll("button")].find((b) => /Buka Undangan/i.test(b.textContent || ""))
        || document.querySelector('[aria-label="Buka undangan"]')`,
    );
    const el = target.asElement() as import("puppeteer-core").ElementHandle<Element> | null;
    if (el) await el.click();
    await sleep(3500);
  });

  const scroll = await collectFrames(page, async () => {
    await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      // Scroll halus ±1200 px/detik, seperti jempol tamu.
      for (let y = 0; y <= max; y += 20) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    });
  });

  await browser.close();
  return { themeId, mode: lite ? "ringan" : "normal", ...vitals, idle, open, scroll, prepared };
}

type Result = Awaited<ReturnType<typeof measure>>;

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
const avgFrames = (xs: FrameStats[]): FrameStats => ({
  fps: avg(xs.map((x) => x.fps)),
  p95: avg(xs.map((x) => x.p95)),
  jankPct: Math.round((xs.reduce((a, x) => a + x.jankPct, 0) / xs.length) * 10) / 10,
});

/** pnpm perf <base> [themeId ...] [--runs=3] — angka dirata-rata dari beberapa kali tes. */
async function main() {
  const args = process.argv.slice(2);
  const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 1);
  const [base = "http://localhost:3300", ...ids] = args.filter((a) => !a.startsWith("--"));
  const themes = ids.length ? ids : THEME_MANIFESTS.map((m) => m.id);

  const rows: { themeId: string; mode: string; runs: Result[] }[] = [];
  for (const id of themes) {
    for (const lite of [false, true]) {
      const results: Result[] = [];
      for (let i = 0; i < runs; i++) {
        const r = await measure(base, id, lite);
        process.stdout.write(
          `… ${id} (${r.mode}) #${i + 1}: LCP ${r.lcp} ms ← ${r.lcpEl} · disiapkan sebelum ketuk: ${r.prepared} section\n`,
        );
        results.push(r);
      }
      rows.push({ themeId: id, mode: lite ? "ringan" : "normal", runs: results });
    }
  }

  const f = (s: FrameStats) => `${s.fps} fps · p95 ${s.p95}ms · patah ${s.jankPct}%`;
  console.log(`\nCPU 4x + Fast 4G, cache kosong, viewport 390×844, rata-rata ${runs}× tes\n`);
  console.log(
    "| Tema | Mode | TTFB | FCP | LCP (cover) | Siap klik | Cover diam | Buka cover | Scroll |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const { themeId, mode, runs: rs } of rows) {
    const lcp = avg(rs.map((r) => r.lcp));
    const range =
      rs.length > 1
        ? ` (${Math.min(...rs.map((r) => r.lcp))}–${Math.max(...rs.map((r) => r.lcp))})`
        : "";
    console.log(
      `| ${themeId} | ${mode} | ${avg(rs.map((r) => r.ttfb))} ms | ${avg(rs.map((r) => r.fcp))} ms | ${lcp} ms${range} ${lcp <= 2500 ? "✅" : "⚠️"} | ${avg(rs.map((r) => r.ready))} ms | ${f(avgFrames(rs.map((r) => r.idle)))} | ${f(avgFrames(rs.map((r) => r.open)))}${avgFrames(rs.map((r) => r.open)).fps >= 55 ? " ✅" : " ⚠️"} | ${f(avgFrames(rs.map((r) => r.scroll)))} |`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
