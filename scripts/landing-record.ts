/**
 * Rekam ulang video mockup HP di hero landing page dari TEMA ASLI.
 * Jalankan lagi setiap kali foto/data contoh tema diganti.
 *
 *   pnpm dev            (atau pnpm start)
 *   pnpm landing:record [base-url] [--theme=renda-rimba]
 *
 * Hasil (dipakai src/app/(marketing)/_landing/Hero.tsx):
 *   public/landing/hero.mp4    H.264 — semua browser (VP9 diuji: justru lebih besar)
 *   public/landing/hero.webp   gambar diam cover (poster & kandidat LCP)
 *
 * Alur: cover diam → ketuk "Buka undangan" → animasi buka → gulir pelan.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";

import { launchBrowser } from "./lib/browser";

const run = promisify(execFile);
const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const theme = args.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "renda-rimba";
const OUT = path.join(process.cwd(), "public/landing");
const TMP = path.join(process.cwd(), ".cache/landing-record");
/** Ukuran video akhir (rasio layar HP 390×844, kelipatan 2 untuk H.264). */
const W = 540;
const H = 1168;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ffmpeg = ffmpegStatic as unknown as string;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(TMP, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const url = `${base}/preview/${theme}?bare=1&to=Tamu%20Undangan`;
  console.log(`Merekam ${url}`);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForSelector("[data-inv-ready]", { timeout: 60000 });
  await sleep(2500); // animasi masuk cover selesai

  // Poster = cover diam.
  const shot = await page.screenshot({ type: "png" });
  await sharp(shot).resize(W, H).webp({ quality: 74 }).toFile(path.join(OUT, "hero.webp"));

  const raw = path.join(TMP, "raw.webm");
  const rec = await page.screencast({
    path: raw as `${string}.webm`,
    ffmpegPath: ffmpeg,
    quality: 8,
  });
  await sleep(1600);
  await page.evaluate(`(document.querySelector('[aria-label="Buka undangan"]') ||
    [...document.querySelectorAll("button")].find((b) => /buka undangan/i.test(b.textContent)))?.click()`);
  await sleep(2800);
  for (let i = 0; i < 40; i++) {
    await page.evaluate("window.scrollBy(0, 9)");
    await sleep(60);
  }
  await sleep(700);
  await rec.stop();
  await browser.close();

  // Durasi rekaman mentah → fade masuk/keluar agar loop tidak menyentak.
  const probe = await run(ffmpeg, ["-i", raw], { maxBuffer: 1 << 24 }).catch(
    (e: { stderr: string }) => ({ stderr: e.stderr }),
  );
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe.stderr);
  const dur = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 8;
  const vf = `scale=${W}:${H}:flags=lanczos,fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=${(dur - 0.45).toFixed(2)}:d=0.45,format=yuv420p`;

  await run(ffmpeg, [
    "-y",
    "-i",
    raw,
    "-an",
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "30",
    "-profile:v",
    "high",
    "-movflags",
    "+faststart",
    path.join(OUT, "hero.mp4"),
  ]);

  for (const f of ["hero.webp", "hero.mp4"]) {
    const st = await fs.stat(path.join(OUT, f));
    console.log(`  public/landing/${f}  ${Math.round(st.size / 1024)} KB`);
  }
  console.log(`✓ Video hero (${dur.toFixed(1)} dtk) dari tema ${theme}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
