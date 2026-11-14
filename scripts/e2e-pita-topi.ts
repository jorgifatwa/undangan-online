/**
 * Uji end-to-end Pita Krayon — foto, topi pesta, sakelar, hapus latar (development).
 *
 *   pnpm dev
 *   pnpm e2e:pita-topi [base-url] [--shots=.reference/report/tema-baru/topi]
 *
 *  - deteksi wajah OTOMATIS di editor setelah foto berganti (tanpa tombol):
 *    kepala tegak, miring, dua orang (wajah terbesar), tanpa wajah (fallback)
 *  - halaman tamu: topi di kepala (auto) / pojok bingkai (default), tidak
 *    terpotong tepi layar; TIDAK memuat model/runtime ML apa pun
 *  - geser topi manual di pratinjau editor → posisi tersimpan (persen relatif
 *    foto, per section); "Atur ulang"; foto diganti → posisi manual direset
 *  - sakelar hitam-putih, ilustrasi kue, topi cover/pembuka
 *  - hapus latar otomatis (CPU 4×): progres → pratinjau → Pakai → foto beralpha;
 *    thread utama editor tidak macet; mode hemat kuota → mode ringan
 */
import fs from "node:fs";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Browser, Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";
import { purchased } from "./lib/purchase";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const SLUG = "uji-pk-topi";
const P = "/placeholders/photos";
const PHOTOS = {
  tegak: { url: `${P}/birthday-g3.webp`, width: 1200, height: 675 },
  miring: { url: `${P}/birthday-celebrant.webp`, width: 801, height: 1200 },
  dua: { url: `${P}/wedding-g6.webp`, width: 0, height: 0 },
  tanpa: { url: `${P}/wedding-closing.webp`, width: 0, height: 0 },
};
type Data = Record<string, unknown> & {
  celebrant: Record<string, unknown>;
  photoDecor?: Record<string, unknown> & {
    face?: { r: number; for: string };
    faceChecked?: string;
  };
};

async function dataOf(id: string) {
  return (await db.invitation.findUniqueOrThrow({ where: { id } })).data as Data;
}
async function setPhoto(
  id: string,
  photo: { url: string; width: number; height: number },
  keepDecor = false,
) {
  const d = await dataOf(id);
  d.celebrant = {
    ...d.celebrant,
    photo: undefined,
    childPhoto: photo.width ? photo : { url: photo.url },
  };
  if (!keepDecor)
    d.photoDecor = { bw: true, cake: true, coverHat: { show: true }, heroHat: { show: true } };
  await db.invitation.update({ where: { id }, data: { data: d as Prisma.InputJsonValue } });
}
async function waitDb(fn: () => Promise<boolean>, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await sleep(600);
  }
  return false;
}

/** Halaman tamu: catat semua request (memastikan tidak ada model/runtime ML). */
async function guest(browser: Browser, name: string, mlHits: string[]) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(MOBILE);
  p.on("request", (r) => {
    if (/\/ml\/|ort-wasm|vision_wasm|tasks-vision|modnet|\.tflite|\.onnx/i.test(r.url()))
      mlHits.push(r.url());
  });
  let workers = 0;
  p.on("workercreated", () => workers++);
  await p.goto(`${base}/${SLUG}?to=Bu%20Rina`, { waitUntil: "networkidle0", timeout: 90000 });
  await p.waitForSelector("[data-inv-ready]");
  await sleep(1800);
  const cover = (await p.evaluate(`(() => {
    const h = document.querySelector('[data-pk-hat="cover"]');
    if (!h) return null;
    const r = h.getBoundingClientRect();
    return { src: h.dataset.hatSrc, l: r.left, r: r.right, vw: innerWidth };
  })()`)) as { src: string; l: number; r: number; vw: number } | null;
  if (shots) await p.screenshot({ path: `${shots}/${name}-cover.png` });
  await p.evaluate(`document.querySelector('[aria-label="Buka undangan"]')?.click()`);
  await sleep(2600);
  const hero = (await p.evaluate(`(() => {
    const sec = document.getElementById("inv-salam");
    const h = sec?.querySelector('[data-pk-hat="hero"]');
    const ph = sec?.querySelector("[data-pk-photo]");
    const img = ph?.querySelector("img");
    const r = h?.getBoundingClientRect();
    const f = ph?.getBoundingClientRect();
    const cake = !!sec?.querySelector('img[src*="cake"]');
    return {
      hat: h ? { src: h.dataset.hatSrc, l: r.left, r: r.right, top: r.top, bottom: r.bottom, cx: (r.left + r.right) / 2 } : null,
      frame: f ? { l: f.left, r: f.right, top: f.top, bottom: f.bottom } : null,
      kind: ph?.dataset.pkPhoto ?? null,
      filter: img ? getComputedStyle(img).filter : null,
      cake,
      vw: innerWidth,
    };
  })()`)) as {
    hat: { src: string; l: number; r: number; top: number; bottom: number; cx: number } | null;
    frame: { l: number; r: number; top: number; bottom: number } | null;
    kind: string | null;
    filter: string | null;
    cake: boolean;
    vw: number;
  };
  await p.evaluate(`document.getElementById("inv-salam")?.scrollIntoView()`);
  await sleep(1500);
  if (shots) {
    const el = await p.$("#inv-salam");
    await el?.screenshot({ path: `${shots}/${name}-hero.png` as `${string}.png` });
  }
  // gulir seluruh halaman: tetap tidak ada ML
  await p.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
  await sleep(1200);
  await ctx.close();
  return { cover, hero, workers };
}

async function editorPage(browser: Browser, token: string, id: string) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.setCookie({
    name: "authjs.session-token",
    value: token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  p.on("dialog", (d) => void d.accept());
  await p.goto(`${base}/dashboard/undangan/${id}/edit`, {
    waitUntil: "networkidle0",
    timeout: 120000,
  });
  // buka grup Foto
  await p.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Foto"))?.click()`,
  );
  await p.waitForSelector('[data-testid="photo-decor"]', { timeout: 20000 });
  return p;
}
const clickLabel = (p: Page, text: string) =>
  p.evaluate(
    `[...document.querySelectorAll("label")].find((l) => l.textContent.includes(${JSON.stringify(text)}))?.querySelector("input")?.click()`,
  );

async function main() {
  assertSafeDatabase("e2e-pita-topi");
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const owner = await db.user.upsert({
    where: { email: "e2e-pk@test.local" },
    update: {},
    create: { email: "e2e-pk@test.local", name: "Uji PK" },
  });
  await db.invitation.deleteMany({ where: { slug: SLUG } });
  const data = buildInitialData({
    eventType: "BIRTHDAY",
    name: "Kirana Putri",
    nickname: "Kirana",
    age: 17,
    date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Jakarta",
    themeId: "pita-krayon",
  }).data;
  const inv = await db.invitation.create({
    data: {
      userId: owner.id,
      slug: SLUG,
      eventType: "BIRTHDAY",
      themeId: "pita-krayon",
      ...purchased("pita-krayon"),
      status: "PUBLISHED",
      publishedAt: new Date(),
      data: data as Prisma.InputJsonValue,
    },
  });
  const token = await encode({
    token: { sub: owner.id, id: owner.id, name: owner.name, email: owner.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const browser = await launchBrowser();
  const mlHits: string[] = [];
  const guestWorkers: number[] = [];

  console.log("Bawaan foto biasa (sebelum deteksi): bingkai stiker + topi pojok");
  await setPhoto(inv.id, PHOTOS.tegak);
  let g = await guest(browser, "0-bawaan", mlHits);
  guestWorkers.push(g.workers);
  check(g.hero.kind === "frame", "foto biasa → bingkai stiker organik");
  check(
    g.hero.hat?.src === "default" && g.cover?.src === "default",
    "tanpa data wajah → topi di pojok bingkai",
  );
  check(!!g.hero.filter?.includes("grayscale"), "hitam-putih menyala sebagai bawaan");
  check(g.hero.cake, "ilustrasi kue tampil sebagai bawaan");

  for (const [name, photo, expect] of [
    ["1-tegak", PHOTOS.tegak, "tegak"],
    ["2-miring", PHOTOS.miring, "miring"],
    ["3-dua-orang", PHOTOS.dua, "dua"],
    ["4-tanpa-wajah", PHOTOS.tanpa, "tanpa"],
  ] as const) {
    console.log(`Deteksi wajah otomatis: ${expect}`);
    await setPhoto(inv.id, photo);
    const ed = await editorPage(browser, token, inv.id);
    const t0 = Date.now();
    const ok = await waitDb(
      async () => (await dataOf(inv.id)).photoDecor?.faceChecked === photo.url,
      90000,
    );
    check(
      ok,
      `editor mendeteksi wajah otomatis setelah foto berganti (${((Date.now() - t0) / 1000).toFixed(1)} dtk, termasuk muat model)`,
    );
    const face = (await dataOf(inv.id)).photoDecor?.face;
    if (expect === "tanpa") check(!face, "tidak ada wajah → tanpa data wajah");
    else
      check(!!face && face.for === photo.url, `wajah terdeteksi (miring ${face?.r.toFixed(1)}°)`);
    if (expect === "tegak") check(Math.abs(face?.r ?? 99) < 10, "kepala tegak → topi hampir tegak");
    if (expect === "miring") check(Math.abs(face?.r ?? 0) > 10, "kepala miring → topi ikut miring");
    await ed.close();
    g = await guest(browser, name, mlHits);
    guestWorkers.push(g.workers);
    const want = expect === "tanpa" ? "default" : "auto";
    check(g.hero.hat?.src === want && g.cover?.src === want, `topi cover & pembuka: ${want}`);
    check(
      !!g.hero.hat &&
        g.hero.hat.l >= 0 &&
        g.hero.hat.r <= g.hero.vw &&
        !!g.cover &&
        g.cover.l >= 0 &&
        g.cover.r <= g.cover.vw,
      "topi tidak terpotong tepi layar",
    );
    if (want === "auto" && g.hero.hat && g.hero.frame) {
      const fh = g.hero.frame.bottom - g.hero.frame.top;
      check(
        g.hero.hat.cx > g.hero.frame.l &&
          g.hero.hat.cx < g.hero.frame.r &&
          g.hero.hat.bottom < g.hero.frame.top + fh * 0.6,
        "topi di atas kepala (bagian atas bingkai)",
      );
    }
  }

  console.log("Geser manual di pratinjau editor + Atur ulang");
  await setPhoto(inv.id, PHOTOS.miring);
  let ed = await editorPage(browser, token, inv.id);
  await waitDb(
    async () => (await dataOf(inv.id)).photoDecor?.faceChecked === PHOTOS.miring.url,
    90000,
  );
  const frame = ed.frames().find((f) => f.url().includes("/pratinjau"))!;
  await frame.evaluate(`document.getElementById("inv-salam")?.scrollIntoView()`);
  await sleep(2500);
  const hat = await frame.$('[data-pk-hat="hero"]');
  const bb = await hat!.boundingBox();
  check(!!bb, "topi bisa disentuh di pratinjau editor");
  if (bb) {
    await ed.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await ed.mouse.down();
    await ed.mouse.move(bb.x + bb.width / 2 + 30, bb.y + bb.height / 2 + 18, { steps: 8 });
    await ed.mouse.up();
  }
  check(
    await waitDb(async () => {
      const h = (await dataOf(inv.id)).photoDecor?.heroHat as
        { src?: string; for?: string } | undefined;
      return h?.src === "manual" && h.for === PHOTOS.miring.url;
    }, 20000),
    "posisi geser tersimpan (persen relatif foto, section pembuka)",
  );
  const cov = (await dataOf(inv.id)).photoDecor?.coverHat as { x?: number } | undefined;
  check(cov?.x === undefined, "section cover tidak ikut berubah (per section)");
  await ed.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Perbesar topi pembuka")?.click()`,
  );
  await sleep(2500);
  g = await guest(browser, "5-geser-manual", mlHits);
  guestWorkers.push(g.workers);
  check(g.hero.hat?.src === "manual", "halaman tamu memakai posisi manual");
  await ed.evaluate(
    `[...document.querySelector('[data-testid="hat-hero"]').querySelectorAll("button")].find((b) => b.textContent.includes("Atur ulang"))?.click()`,
  );
  check(
    await waitDb(
      async () =>
        ((await dataOf(inv.id)).photoDecor?.heroHat as { x?: number } | undefined)?.x === undefined,
      15000,
    ),
    "Atur ulang → kembali ke posisi otomatis",
  );
  await ed.close();

  console.log("Foto diganti → posisi manual direset");
  const d0 = await dataOf(inv.id);
  d0.photoDecor = {
    ...d0.photoDecor,
    heroHat: { show: true, x: 10, y: 10, w: 20, r: 0, for: PHOTOS.miring.url, src: "manual" },
  };
  await db.invitation.update({
    where: { id: inv.id },
    data: { data: d0 as Prisma.InputJsonValue },
  });
  await setPhoto(inv.id, PHOTOS.tegak, true);
  ed = await editorPage(browser, token, inv.id);
  check(
    await waitDb(async () => {
      const pd = (await dataOf(inv.id)).photoDecor;
      return (
        pd?.faceChecked === PHOTOS.tegak.url && (pd.heroHat as { x?: number })?.x === undefined
      );
    }, 90000),
    "posisi topi manual untuk foto lama direset",
  );

  console.log("Sakelar");
  await clickLabel(ed, "Hitam-putih");
  await clickLabel(ed, "Tampilkan ilustrasi kue");
  await clickLabel(ed, "Tampilkan topi pesta di cover");
  check(
    await waitDb(async () => {
      const pd = (await dataOf(inv.id)).photoDecor as {
        bw?: boolean;
        cake?: boolean;
        coverHat?: { show?: boolean };
      };
      return pd?.bw === false && pd.cake === false && pd.coverHat?.show === false;
    }, 20000),
    "sakelar tersimpan (hitam-putih, kue, topi cover mati)",
  );
  g = await guest(browser, "6-sakelar-mati", mlHits);
  guestWorkers.push(g.workers);
  check(!g.hero.filter?.includes("grayscale"), "hitam-putih mati → foto berwarna");
  check(!g.hero.cake, "ilustrasi kue mati → tidak tampil");
  check(g.cover === null && !!g.hero.hat, "topi cover mati, topi pembuka tetap");
  await clickLabel(ed, "Hitam-putih");
  await clickLabel(ed, "Tampilkan ilustrasi kue");
  await clickLabel(ed, "Tampilkan topi pesta di cover");
  await sleep(2500);
  g = await guest(browser, "7-sakelar-nyala", mlHits);
  check(
    !!g.hero.filter?.includes("grayscale") && g.hero.cake && !!g.cover,
    "dinyalakan lagi → tampil kembali",
  );

  console.log("Hapus latar otomatis (CPU 4×)");
  // foto potret (MODNet unggul di potret; foto grup lanskap memakai cadangan mode ringan)
  await ed.close();
  await setPhoto(inv.id, PHOTOS.miring);
  ed = await editorPage(browser, token, inv.id);
  await waitDb(
    async () => (await dataOf(inv.id)).photoDecor?.faceChecked === PHOTOS.miring.url,
    90000,
  );
  const cdp = await ed.createCDPSession();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await ed.evaluate(
    `window.__long=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__long.push(Math.round(e.duration))}).observe({type:'longtask'})`,
  );
  await ed.evaluate(`caches.delete("pk-ml-v1")`); // sesi bersih → dialog ukuran unduhan tampil
  await ed.click('[data-testid="bg-remove"]');
  check(
    await ed
      .waitForFunction(`document.body.innerText.includes("sekitar 9 MB, hanya sekali")`, {
        timeout: 10000,
      })
      .then(
        () => true,
        () => false,
      ),
    'dialog ukuran unduhan: "sekitar 9 MB, hanya sekali" + Lanjut/Batal',
  );
  const t1 = Date.now();
  await ed.evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Lanjut")?.click()`,
  );
  const sawProgress = await ed
    .waitForFunction(`/Mengunduh alat penghapus latar… \\d+%/.test(document.body.innerText)`, {
      timeout: 15000,
    })
    .then(
      () => true,
      () => false,
    );
  check(sawProgress, "progres unduhan tampil");
  await ed
    .waitForFunction(
      `document.querySelector('[data-testid="cutout-preview"]') || document.querySelector('[role="dialog"] [role="alert"]')`,
      { timeout: 240000 },
    )
    .catch(() => undefined);
  const dlg = await ed.evaluate(`document.querySelector('[role="dialog"]')?.innerText ?? ""`);
  if (!(await ed.$('[data-testid="cutout-preview"]')))
    console.log("    isi dialog:", JSON.stringify(dlg).slice(0, 300));
  const procMs = Date.now() - t1;
  const long = (await ed.evaluate("window.__long")) as number[];
  check(
    true,
    `selesai dalam ${(procMs / 1000).toFixed(1)} dtk (CPU 4×, termasuk unduh & muat model)`,
  );
  check(
    long.filter((x) => x > 200).length === 0,
    `editor tidak macet: tugas panjang thread utama ${long.length ? `${long.length}× (maks ${Math.max(...long)} ms)` : "tidak ada"}`,
  );
  if (shots)
    await (
      await ed.$('[role="dialog"]')
    )?.screenshot({ path: `${shots}/8-hapus-latar-pratinjau.png` });
  check(!(await ed.$('[data-testid="cutout-lite"]')), "hasil memakai MODNet (bukan mode ringan)");
  await ed.evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Pakai")?.click()`,
  );
  check(
    await waitDb(
      async () =>
        ((await dataOf(inv.id)).celebrant.childPhoto as { alpha?: boolean } | undefined)?.alpha ===
        true,
      60000,
    ),
    "Pakai → foto beralpha tersimpan lewat pipeline media",
  );
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await sleep(1500);
  g = await guest(browser, "9-hapus-latar", mlHits);
  guestWorkers.push(g.workers);
  check(g.hero.kind === "cutout" && !!g.hero.hat, "pembuka: siluet + topi");

  console.log("Mode hemat kuota → mode ringan");
  await setPhoto(inv.id, PHOTOS.tegak);
  await ed.close();
  ed = await editorPage(browser, token, inv.id);
  await waitDb(
    async () => (await dataOf(inv.id)).photoDecor?.faceChecked === PHOTOS.tegak.url,
    60000,
  );

  console.log("MODNet gagal (foto grup lanskap) → otomatis mode ringan");
  // model sudah tersimpan → dialog langsung memproses tanpa konfirmasi
  await ed.click('[data-testid="bg-remove"]');
  await ed
    .waitForSelector('[data-testid="cutout-preview"]', { timeout: 120000 })
    .catch(() => undefined);
  check(
    !!(await ed.$('[data-testid="cutout-lite"]')),
    "hasil kosong dari MODNet → mode ringan otomatis + kalimat pemberitahuan",
  );
  if (shots)
    await (
      await ed.$('[role="dialog"]')
    )?.screenshot({ path: `${shots}/11-cadangan-otomatis.png` });
  await ed.evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("Kembali ke bingkai biasa"))?.click()`,
  );
  await sleep(600);
  await ed.evaluate(`caches.delete("pk-ml-v1")`); // sesi bersih → dialog ukuran unduhan tampil
  await ed.click('[data-testid="bg-remove"]');
  await sleep(800);
  // model MODNet sudah tersimpan → dialog bisa langsung memproses; bila masih menampilkan
  // konfirmasi, pilih mode hemat kuota
  const confirm = await ed.evaluate(`document.body.innerText.includes("Mode hemat kuota")`);
  if (confirm) {
    await clickLabel(ed, "Mode hemat kuota");
    await ed.evaluate(
      `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Lanjut")?.click()`,
    );
    await ed.waitForSelector('[data-testid="cutout-preview"]', { timeout: 120000 });
    check(
      !!(await ed.$('[data-testid="cutout-lite"]')),
      "mode hemat kuota → hasil mode ringan + kalimat pemberitahuan",
    );
    if (shots)
      await (await ed.$('[role="dialog"]'))?.screenshot({ path: `${shots}/10-mode-ringan.png` });
    await ed.evaluate(
      `[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("Kembali ke bingkai biasa"))?.click()`,
    );
    await sleep(800);
    check(
      !((await dataOf(inv.id)).celebrant.childPhoto as { alpha?: boolean }).alpha,
      "Kembali ke bingkai biasa → foto tidak diubah",
    );
  } else
    check(
      true,
      "model sudah tersimpan → dialog langsung memproses (mode hemat diuji di sesi bersih)",
    );
  await ed.close();

  console.log("Halaman tamu tanpa model ML");
  check(
    mlHits.length === 0,
    `halaman tamu: 0 request model/runtime ML${mlHits.length ? ` (${mlHits.slice(0, 2).join(", ")})` : ""}`,
  );
  check(
    guestWorkers.every((w) => w === 0),
    "halaman tamu: tidak membuat Web Worker",
  );

  await browser.close();
  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
