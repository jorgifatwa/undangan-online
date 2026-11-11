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
    const w = window as unknown as { __lcp: number };
    w.__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const url = `${base}/preview/${themeId}?to=Bapak%20Budi${lite ? "&lite=1" : ""}`;
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("[data-inv-ready]", { timeout: 60000 });
  await sleep(1500);

  const vitals = await page.evaluate(() => {
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const ready = performance.getEntriesByName("inv-ready")[0]?.startTime ?? 0;
    const lcp = (window as unknown as { __lcp: number }).__lcp;
    return { fcp: Math.round(fcp), lcp: Math.round(lcp), ready: Math.round(ready) };
  });

  const idle = await collectFrames(page, () => sleep(3000));

  const open = await collectFrames(page, async () => {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /Buka Undangan/i.test(b.textContent ?? ""),
      );
      btn?.click();
    });
    await sleep(3000);
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
  return { themeId, mode: lite ? "ringan" : "normal", ...vitals, idle, open, scroll };
}

async function main() {
  const [base = "http://localhost:3300", ...ids] = process.argv.slice(2);
  const themes = ids.length ? ids : THEME_MANIFESTS.map((m) => m.id);
  const rows: Awaited<ReturnType<typeof measure>>[] = [];
  for (const id of themes) {
    for (const lite of [false, true]) {
      process.stdout.write(`… ${id} (${lite ? "ringan" : "normal"})\n`);
      rows.push(await measure(base, id, lite));
    }
  }

  const f = (s: FrameStats) => `${s.fps} fps · p95 ${s.p95}ms · patah ${s.jankPct}%`;
  console.log("\nCPU 4x + Fast 4G, cache kosong, viewport 390×844\n");
  console.log("| Tema | Mode | FCP | LCP (cover) | Siap klik | Cover diam | Buka cover | Scroll |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const lcpMark = r.lcp <= 2500 ? "✅" : "⚠️";
    console.log(
      `| ${r.themeId} | ${r.mode} | ${r.fcp} ms | ${r.lcp} ms ${lcpMark} | ${r.ready} ms | ${f(r.idle)} | ${f(r.open)} | ${f(r.scroll)} |`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
