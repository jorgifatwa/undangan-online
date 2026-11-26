/**
 * Rekam gambar layar "HP bercerita" di landing dari TEMA ASLI (Tirai Beludru).
 * Jalankan lagi bila data contoh / tampilan tema berubah.
 *
 *   pnpm dev
 *   pnpm landing:story [base-url] [--theme=tirai-beludru]
 *
 * Hasil: public/landing/story-{profil,acara,ucapan,galeri}.webp (540×1168, ±40–70 KB).
 * Sampul memakai public/landing/hero.webp (dari pnpm landing:record).
 */
import fs from "node:fs/promises";

import sharp from "sharp";

import { launchBrowser } from "./lib/browser";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const theme = args.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "tirai-beludru";
const SHOTS = ["profil", "acara", "ucapan", "galeri"] as const;

async function main() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 1.4,
      isMobile: true,
      hasTouch: true,
    });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const s of SHOTS) {
      const url = `${base}/preview/${theme}?bare=1&open=1&to=Tamu%20Undangan&focus=${s}`;
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForFunction(
        (id) => !!document.getElementById(`inv-${id}`),
        { timeout: 20000 },
        s,
      );
      await new Promise((r) => setTimeout(r, 2200)); // gambar & animasi masuk selesai
      await page.evaluate((id) => {
        const el = document.getElementById(`inv-${id}`)!;
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      }, s);
      await new Promise((r) => setTimeout(r, 1200));
      const png = await page.screenshot({ type: "png" });
      const out = `public/landing/story-${s}.webp`;
      await sharp(png)
        .resize(540, 1168, { fit: "cover", position: "top" })
        .webp({ quality: 74 })
        .toFile(out);
      console.log(`  ${out}  ${Math.round((await fs.stat(out)).size / 1024)} KB`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
