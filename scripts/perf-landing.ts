/**
 * Uji performa halaman website (landing & halaman pendukung) — build production.
 *
 *   pnpm build && pnpm start
 *   pnpm perf:landing [base-url] [--runs=3] [/ /harga …]
 *
 * CPU 4x + Fast 4G, cache kosong per tes, HP (390×844) & desktop (1440×900).
 * Target: LCP < 2,5 dtk, CLS < 0,1.
 */
import type { Page } from "puppeteer-core";

import { FAST_4G, launchBrowser, MOBILE_VIEWPORT } from "./lib/browser";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 3);
const paths = args.filter((a) => a.startsWith("/"));
if (!paths.length) paths.push("/");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Result {
  ttfb: number;
  fcp: number;
  lcp: number;
  lcpEl: string;
  cls: number;
  kb: number;
  jsKb: number;
}

async function measure(page: Page, url: string): Promise<Result> {
  await page.evaluateOnNewDocument(() => {
    const w = window as unknown as { __lcp: number; __lcpEl: string; __cls: number };
    w.__lcp = 0;
    w.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
        w.__lcp = e.startTime;
        const el = e.element;
        w.__lcpEl = el
          ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.textContent ?? (el as HTMLImageElement).src ?? "").trim().slice(0, 30)}"`
          : "?";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[])
        if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  let bytes = 0;
  let js = 0;
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  const types = new Map<string, string>();
  cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
  cdp.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
    if (types.get(e.requestId) === "Script") js += e.encodedDataLength;
  });
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await sleep(3000);
  // interaksi pertama mengakhiri pencatatan LCP
  const v = (await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const w = window as unknown as { __lcp: number; __lcpEl: string; __cls: number };
    return {
      ttfb: nav.responseStart - nav.startTime,
      fcp,
      lcp: w.__lcp,
      lcpEl: w.__lcpEl,
      cls: w.__cls,
    };
  })) as Omit<Result, "kb" | "jsKb">;
  return { ...v, kb: bytes / 1024, jsKb: js / 1024 };
}

async function main() {
  const browser = await launchBrowser();
  const rows: string[] = [];
  for (const path of paths)
    for (const [mode, vp] of [
      ["HP", MOBILE_VIEWPORT],
      ["desktop", { width: 1440, height: 900, deviceScaleFactor: 1 }],
    ] as const) {
      const rs: Result[] = [];
      for (let i = 0; i < runs; i++) {
        const ctx = await browser.createBrowserContext();
        const page = await ctx.newPage();
        await page.setViewport(vp);
        await page.emulateCPUThrottling(4);
        await page.emulateNetworkConditions(FAST_4G);
        const r = await measure(page, `${base}${path}`);
        console.log(
          `… ${path} (${mode}) #${i + 1}: LCP ${Math.round(r.lcp)} ms ← ${r.lcpEl} · CLS ${r.cls.toFixed(3)}`,
        );
        rs.push(r);
        await ctx.close();
      }
      const avg = (k: keyof Omit<Result, "lcpEl">) => rs.reduce((s, r) => s + r[k], 0) / rs.length;
      const lcps = rs.map((r) => Math.round(r.lcp));
      rows.push(
        `| ${path} | ${mode} | ${Math.round(avg("ttfb"))} ms | ${Math.round(avg("fcp"))} ms | ` +
          `${Math.round(avg("lcp"))} ms (${Math.min(...lcps)}–${Math.max(...lcps)}) ${avg("lcp") < 2500 ? "✅" : "⚠️"} | ` +
          `${avg("cls").toFixed(3)} ${avg("cls") < 0.1 ? "✅" : "⚠️"} | ${Math.round(avg("kb"))} KB | ${Math.round(avg("jsKb"))} KB |`,
      );
    }
  await browser.close();
  console.log(
    `\nCPU 4x + Fast 4G, cache kosong, rata-rata ${runs}× tes (unduhan dihitung 3 dtk setelah load)\n`,
  );
  console.log("| Halaman | Mode | TTFB | FCP | LCP | CLS | Unduhan | JS |");
  console.log("|---|---|---|---|---|---|---|---|");
  console.log(rows.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
