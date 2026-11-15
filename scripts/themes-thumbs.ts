/**
 * Thumbnail galeri tema = screenshot cover sungguhan tiap tema (data contoh,
 * varian default) → public/theme-thumbs/{id}.webp, lalu themes:sync
 * mendaftarkannya ke registry.generated.ts (dipakai halaman /tema).
 *
 *   pnpm dev                       (atau pnpm build && pnpm start)
 *   pnpm themes:thumbs [base] [themeId ...]     base default http://localhost:3000
 *
 * Jalankan ulang setiap kali cover tema berubah.
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { THEME_MANIFESTS } from "../src/themes/registry.generated";
import { launchBrowser } from "./lib/browser";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const only = args.filter((a) => !a.startsWith("http"));
const OUT = path.join(process.cwd(), "public/theme-thumbs");
/** Ukuran kartu di /tema ±220 px lebar → 2× untuk layar retina. */
const W = 360;
const H = 640;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await launchBrowser();
  const themes = THEME_MANIFESTS.filter((m) => !only.length || only.includes(m.id));
  for (const m of themes) {
    const page = await browser.newPage();
    await page.setViewport({
      width: W,
      height: H,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    // tanpa nama tamu: thumbnail menampilkan cover apa adanya
    const res = await page.goto(`${base}/preview/${m.id}?bare=1`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    // jangan memotret layar error (status ≠ 200, atau tema belum hidrasi / overlay error dev)
    const ready = await page
      .waitForSelector("[data-inv-ready]", { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (res?.status() !== 200 || !ready)
      throw new Error(
        `${m.id}: halaman preview tidak siap (status ${res?.status()}) — cek error build`,
      );
    await page.evaluate("document.fonts.ready");
    // tunggu animasi masuk cover selesai
    await new Promise((r) => setTimeout(r, 2500));
    const png = await page.screenshot({ type: "png" });
    const file = path.join(OUT, `${m.id}.webp`);
    await sharp(png)
      .resize({ width: W * 1.5 })
      .webp({ quality: 78, effort: 6 })
      .toFile(file);
    const kb = Math.round((await fs.stat(file)).size / 1024);
    console.log(`  ✓ ${m.id} → public/theme-thumbs/${m.id}.webp (${kb} KB)`);
    await page.close();
  }
  await browser.close();
  execSync("pnpm -s themes:sync", { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
