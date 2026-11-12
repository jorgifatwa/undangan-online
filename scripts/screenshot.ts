/**
 * Screenshot halaman undangan di ukuran HP.
 *
 *   pnpm tsx scripts/screenshot.ts <url> <out.png> [--open] [--full] [--width=390] [--height=844] [--wait=1500]
 *
 * --open  klik tombol "Buka Undangan" dulu, lalu scroll pelan sampai bawah
 *         (agar animasi masuk terpicu) sebelum mengambil gambar.
 * --full  tangkap seluruh halaman.
 */
import { launchBrowser } from "./lib/browser";

async function main() {
  const [url, out, ...flags] = process.argv.slice(2);
  if (!url || !out) throw new Error("Pakai: screenshot.ts <url> <out.png> [--open] [--full]");
  const flag = (name: string) => flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
  const num = (name: string, d: number) => Number(flag(name)?.split("=")[1] ?? d);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({
    width: num("width", 390),
    height: num("height", 844),
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, num("wait", 1500)));

  if (flag("open")) {
    // Tombol "Buka Undangan" atau elemen cover ber-aria-label "Buka undangan" (mis. amplop)
    await page.evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => /Buka Undangan/i.test(b.textContent || ""))
        || document.querySelector('[aria-label="Buka undangan"]');
      btn && btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 3500));
    // Scroll bertahap supaya semua <Reveal> terpicu, lalu kembali ke atas.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      await new Promise((r) => setTimeout(r, 1200));
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 500));
  }

  if (flag("full")) {
    // Viewport setinggi halaman: semua section "terlihat" sehingga content-visibility
    // & animasi masuk ikut dirender (fullPage puppeteer tidak memicunya).
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewport({
      width: num("width", 390),
      height,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 2500));
  }
  await page.screenshot({ path: out as `${string}.png` });
  await browser.close();
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
