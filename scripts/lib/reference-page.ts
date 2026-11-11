/**
 * Membuka halaman referensi live dalam viewport HP yang sangat tinggi,
 * sehingga semua section "terlihat" sekaligus: animasi masuk (reveal) terpicu
 * dan kontainer scroll internal (position: fixed + overflow) terbentang penuh.
 */
import type { Browser, Page } from "puppeteer-core";

export const REF_WIDTH = 430;

export async function openTall(
  browser: Browser,
  url: string,
  height: number,
  settleMs = 5000,
): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({
    width: REF_WIDTH,
    height,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  // tsx/esbuild menyisipkan helper __name ke fungsi yang dikirim ke browser.
  await page.evaluateOnNewDocument("window.__name = (fn) => fn;");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, settleMs));
  return page;
}

/** Tinggi konten sebenarnya (dokumen atau kontainer scroll internal terbesar). */
export async function contentHeight(page: Page): Promise<number> {
  return (await page.evaluate(`(() => {
    let h = document.documentElement.scrollHeight;
    for (const el of document.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      if ((s.overflowY === "auto" || s.overflowY === "scroll") && el.scrollHeight > h) h = el.scrollHeight;
    }
    return h;
  })()`)) as number;
}

export interface FoundSection {
  key: string;
  label: string;
  top: number;
  height: number;
}

/**
 * Kumpulkan section halaman: <section> (Canva/Jorgi) + blok yang dibuat
 * JS referensi. Label diambil dari id (Jorgi) atau kata kunci teks (Subagja).
 */
export async function collectSections(page: Page, fallbackKey: string): Promise<FoundSection[]> {
  return (await page.evaluate(`(() => {
    const KEYWORDS = [
      [/Ar[ -]?Rum|play the music/i, "Ayat + piringan hitam"],
      [/SAVE THE DATE/i, "Save the date + hitung mundur"],
      [/AKAD|RESEPSI|Petunjuk Lokasi/i, "Mempelai + acara"],
      [/Gallery/i, "Galeri"],
      [/Wedding Gift/i, "Wedding Gift"],
      [/Konfirmasi Kehadiran|Dinding Tamu/i, "RSVP & ucapan"],
      [/Akan Menikah/i, "Polaroid + penutup"],
      [/kehormatan|berbahagia/i, "Penutup"],
      [/Buka Undangan|The Wedding Of/i, "Cover"],
    ];
    const els = [...document.querySelectorAll("section")];
    const out = [];
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.height < 40 || r.width < 100) return;
      const text = (el.innerText || "").replace(/\\s+/g, " ");
      let label = el.id && el.id.startsWith("section-") ? el.id : "";
      if (!label) for (const [re, l] of KEYWORDS) if (re.test(text)) { label = l; break; }
      out.push({ key: el.id || "s" + i, label: label || "Section " + (i + 1), top: Math.round(r.top + scrollY), height: Math.round(r.height) });
    });
    out.sort((a, b) => a.top - b.top);
    // Konten di atas <section> pertama (mis. kartu ayat Jorgi yang bukan <section>).
    const firstTop = out.length ? out[0].top : Math.round(innerHeight);
    if (firstTop > 60) out.unshift({ key: "section-intro", label: out.length ? "section-intro" : "${fallbackKey}", top: 0, height: firstTop });
    return out;
  })()`)) as FoundSection[];
}

export interface FoundAsset {
  base: string;
  rect: { x: number; y: number; width: number; height: number };
}

/** Semua pemakaian gambar di DOM: <img>, <image>, background/border/mask-image. */
export async function collectAssetUsages(page: Page): Promise<FoundAsset[]> {
  return (await page.evaluate(`(() => {
    const base = (u) => {
      try {
        let url = new URL(u, location.href);
        if (url.pathname.startsWith("/_next/image")) url = new URL(url.searchParams.get("url"), location.href);
        return decodeURIComponent(url.pathname.split("/").pop() || "").replace(/\\.[^.]+$/, "");
      } catch { return ""; }
    };
    const urls = (v) => [...(v || "").matchAll(/url\\(["']?([^"')]+)["']?\\)/g)].map((m) => m[1]).filter((u) => !u.startsWith("data:"));
    const found = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const list = [];
      if (el.tagName === "IMG") list.push(el.currentSrc || el.src);
      if (el.tagName === "image") list.push(el.getAttribute("href") || el.getAttribute("xlink:href"));
      const s = getComputedStyle(el);
      list.push(...urls(s.backgroundImage), ...urls(s.borderImageSource), ...urls(s.maskImage || s.webkitMaskImage));
      for (const u of list) {
        if (!u) continue;
        const b = base(u);
        if (b) found.push({ base: b, rect: { x: r.x, y: r.y + scrollY, width: r.width, height: r.height } });
      }
    }
    return found;
  })()`)) as FoundAsset[];
}
