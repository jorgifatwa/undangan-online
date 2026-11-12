/**
 * Helper puppeteer-core memakai Chrome yang terpasang (tanpa unduh Chromium).
 * Lokasi Chrome bisa diatur lewat env CHROME_PATH.
 */
import fs from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean) as string[];

export async function launchBrowser(): Promise<Browser> {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("Chrome tidak ditemukan. Set env CHROME_PATH.");
  // CHROME_ARGS: flag tambahan, mis. "--disable-frame-rate-limit" saat laptop
  // memakai baterai (Chrome membatasi rAF ke 30 fps; halaman kosong pun 30 fps).
  const extra = (process.env.CHROME_ARGS ?? "").split(/\s+/).filter(Boolean);
  return puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", ...extra] });
}

/** Profil HP Android kelas menengah-bawah untuk pengujian. */
export const MOBILE_VIEWPORT = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

/** Preset jaringan "Fast 4G" Chrome DevTools. */
export const FAST_4G = {
  offline: false,
  latency: 165,
  download: (9 * 1024 * 1024) / 8,
  upload: (1.5 * 1024 * 1024) / 8,
};
