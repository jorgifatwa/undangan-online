/**
 * Uji end-to-end upload foto & musik (development, STORAGE_DRIVER=local).
 *
 *   pnpm dev
 *   pnpm e2e:media [base-url] [--shots=.reference/report/3c]
 *
 * Membuat file uji sendiri: JPEG ber-EXIF, HEIC asli (sips, macOS), file palsu,
 * PNG 9000 px, MP3 (ffmpeg). Yang diuji: crop + kompres WebP + EXIF dibuang,
 * HEIC → JPEG di browser, ganti foto → file lama terhapus, galeri multi-pilih +
 * batas paket + upgrade, urutan galeri (keyboard), potong ulang, magic bytes,
 * batas dimensi, kuota akun, musik (paket, persetujuan, proses asinkron →
 * AAC), akses undangan orang lain, pembersihan file mentah 24 jam.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { ElementHandle, HTTPRequest, Page } from "puppeteer-core";
import sharp from "sharp";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const shots = args.find((a) => a.startsWith("--shots="))?.split("=")[1];
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const COOKIE = "authjs.session-token";
const UPLOADS = path.join(process.cwd(), ".uploads");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-media-"));

let failed = 0;
function check(ok: boolean, label: string) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
}

async function user(email: string, name: string) {
  const u = await db.user.upsert({ where: { email }, update: { name }, create: { email, name } });
  await db.media.deleteMany({ where: { userId: u.id } });
  await db.invitation.deleteMany({ where: { userId: u.id } });
  const token = await encode({
    token: { sub: u.id, id: u.id, name, email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });
  return { u, token };
}

async function invitation(userId: string, slug: string, pkg: "FREE" | "BASIC") {
  await db.invitation.deleteMany({ where: { slug } });
  const data = buildInitialData({
    eventType: "WEDDING",
    brideName: "Larasati Wulandari",
    brideNickname: "Laras",
    groomName: "Bima Prasetya",
    groomNickname: "Bima",
    date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    timezone: "WIB",
    city: "Yogyakarta",
    greeting: "islami",
    quoteId: "ar-rum-21",
    themeId: "renda-rimba",
  }).data;
  return db.invitation.create({
    data: {
      userId,
      slug,
      eventType: "WEDDING",
      themeId: "renda-rimba",
      package: pkg,
      data: data as Prisma.InputJsonValue,
    },
  });
}

async function makeFiles() {
  const f = (n: string) => path.join(TMP, n);
  const photo = (seed: number) =>
    sharp({
      create: {
        width: 1600,
        height: 2000,
        channels: 3,
        background: { r: 40 + seed * 20, g: 90, b: 120 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="1600" height="2000"><text x="200" y="1000" font-size="300" fill="white">Foto ${seed}</text></svg>`,
          ),
        },
      ])
      .jpeg({ quality: 85 })
      .withExif({ IFD0: { Artist: "RAHASIA-EXIF-UJI", Copyright: "lokasi-uji" } })
      .toFile(f(`foto-${seed}.jpg`));
  for (let i = 1; i <= 8; i++) await photo(i);
  execFileSync("sips", ["-s", "format", "heic", f("foto-1.jpg"), "--out", f("iphone.heic")], {
    stdio: "ignore",
  });
  fs.writeFileSync(f("palsu.jpg"), "ini bukan foto, hanya teks yang diganti namanya".repeat(20));
  fs.writeFileSync(f("palsu.mp3"), "ini juga bukan musik".repeat(50));
  await sharp({ create: { width: 9000, height: 20, channels: 3, background: "#888" } })
    .png()
    .toFile(f("raksasa.png"));
  const ffmpeg = (await import("ffmpeg-static")).default as unknown as string;
  execFileSync(
    ffmpeg,
    ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=6", "-b:a", "192k", f("lagu.mp3")],
    {
      stdio: "ignore",
    },
  );
  return f;
}

const text = (page: Page) => page.evaluate("document.body.innerText") as Promise<string>;
const clickText = (page: Page, t: string, sel = "button") =>
  page.evaluate(
    `[...document.querySelectorAll(${JSON.stringify(sel)})].find((b) => b.textContent.includes(${JSON.stringify(t)}))?.click()`,
  );
async function openGroup(page: Page, title: string) {
  const open = await page.evaluate(
    `[...document.querySelectorAll("button[aria-expanded]")].find((b) => b.textContent.includes(${JSON.stringify(title)}))?.getAttribute("aria-expanded")`,
  );
  if (open !== "true") await clickText(page, title);
  await sleep(400);
}
async function fileInput(page: Page, label: string, nth = 0) {
  const all = await page.$$(`input[type="file"][aria-label="${label}"]`);
  return all[nth] as ElementHandle<HTMLInputElement>;
}
async function waitStatus(page: Page, s: string, ms = 10000) {
  return page
    .waitForFunction(
      `document.querySelector('[role="status"]')?.textContent.includes(${JSON.stringify(s)})`,
      { timeout: ms },
    )
    .then(() => true)
    .catch(() => false);
}
async function waitText(page: Page, s: string, ms = 15000) {
  return page
    .waitForFunction(`document.body.innerText.includes(${JSON.stringify(s)})`, { timeout: ms })
    .then(() => true)
    .catch(() => false);
}
/** Gulir ke elemen berisi teks sebelum memotret (form panjang di HP). */
const scrollToText = (page: Page, t: string) =>
  page.evaluate(`(() => {
    const el = [...document.querySelectorAll("p, legend, ul, label, button")].find((e) => e.textContent.includes(${JSON.stringify(t)}));
    el?.scrollIntoView({ block: "center" });
  })()`);
const shot = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` as `${string}.png` });
};
const dataOf = async (id: string) =>
  (await db.invitation.findUnique({ where: { id } }))!.data as Record<string, unknown> & {
    bride: { photo?: { url: string } };
    groom: { photo?: { url: string } };
    gallery: { url: string }[];
    music?: { tracks: { url: string }[] };
  };
/** Tunggu sampai kondisi di database terpenuhi (upload → finalize → autosave). */
async function waitDb(fn: () => Promise<boolean>, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await sleep(500);
  }
  return false;
}
const fileOf = (url: string) => path.join(UPLOADS, url.replace(/^\/media\//, ""));

async function main() {
  const f = await makeFiles();
  const a = await user("e2e-a@test.local", "Uji A");
  const c = await user("e2e-c@test.local", "Uji C");
  const free = await invitation(a.u.id, "uji-media-free", "FREE");
  const basic = await invitation(a.u.id, "uji-media-basic", "BASIC");
  const invC = await invitation(c.u.id, "uji-media-c", "FREE");

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await page.setCookie({
    name: COOKIE,
    value: a.token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  page.on("dialog", (d) => void d.accept());
  const edit = (id: string) => `${base}/dashboard/undangan/${id}/edit`;

  // dev: kompilasi rute lebih dulu agar request pertama tidak terputus saat Turbopack membangun
  await fetch(`${base}/api/upload/local`, { method: "PUT" }).catch(() => undefined);
  await fetch(`${base}/media/m/x.webp`).catch(() => undefined);

  console.log("Foto profil: crop + kompres + EXIF dibuang");
  await page.goto(edit(free.id), { waitUntil: "networkidle0", timeout: 90000 });
  await openGroup(page, "Mempelai");
  await (await fileInput(page, "Pilih Foto", 0)).uploadFile(f("foto-1.jpg"));
  check(await waitText(page, "Simpan potongan"), "dialog potong muncul (rasio 4:5)");
  await sleep(800);
  await shot(page, "mobile-1-crop");
  await clickText(page, "Simpan potongan");
  await waitText(page, "Mengunggah", 3000);
  await shot(page, "mobile-2-mengunggah");
  check(
    await waitDb(async () => !!(await dataOf(free.id)).bride.photo?.url),
    "foto tersimpan ke data undangan",
  );
  let d = await dataOf(free.id);
  const brideUrl = d.bride.photo?.url ?? "";
  check(
    brideUrl.startsWith("/media/m/") && brideUrl.endsWith(".webp"),
    `URL WebP final (${brideUrl.slice(0, 40)}…)`,
  );
  const meta = await sharp(fs.readFileSync(fileOf(brideUrl))).metadata();
  check(
    meta.format === "webp" && Math.abs(meta.width! / meta.height! - 0.8) < 0.02,
    `WebP 4:5 (${meta.width}×${meta.height})`,
  );
  check(
    !meta.exif && !fs.readFileSync(fileOf(brideUrl)).includes("RAHASIA-EXIF-UJI"),
    "EXIF dihapus",
  );
  await shot(page, "mobile-3-foto-tersimpan");

  console.log("HEIC dari iPhone");
  await (await fileInput(page, "Pilih Foto", 1)).uploadFile(f("iphone.heic"));
  check(
    await waitText(page, "Simpan potongan", 30000),
    "HEIC dikonversi di browser → dialog potong",
  );
  await sleep(800);
  await clickText(page, "Simpan potongan");
  check(
    await waitDb(async () => !!(await dataOf(free.id)).groom.photo?.url, 45000),
    "foto HEIC tersimpan",
  );
  d = await dataOf(free.id);
  check(
    !!d.groom.photo?.url.endsWith(".webp") && fs.existsSync(fileOf(d.groom.photo!.url)),
    "HEIC → WebP di server",
  );

  console.log("Ganti foto → file lama dihapus");
  await (await fileInput(page, "Pilih Foto", 0)).uploadFile(f("foto-2.jpg"));
  await waitText(page, "Simpan potongan");
  await sleep(600);
  await clickText(page, "Simpan potongan");
  await waitDb(async () => (await dataOf(free.id)).bride.photo?.url !== brideUrl);
  await waitDb(async () => !fs.existsSync(fileOf(brideUrl)), 10000);
  d = await dataOf(free.id);
  check(d.bride.photo?.url !== brideUrl, "URL foto baru");
  check(!fs.existsSync(fileOf(brideUrl)), "file lama terhapus dari penyimpanan");
  check(
    !(await db.media.findFirst({ where: { key: brideUrl.replace("/media/", "") } })),
    "baris Media lama terhapus",
  );

  console.log("Pengaman upload");
  await (await fileInput(page, "Pilih Foto", 0)).uploadFile(f("palsu.jpg"));
  check(
    await waitText(page, "bukan foto yang bisa dibuka", 8000),
    "browser: file teks bernama .jpg ditolak sebelum diunggah",
  );
  // Server juga memeriksa magic bytes (bila pemeriksaan browser dilewati):
  {
    const { requestUpload, finalizePhoto, UploadError } = await import("../src/lib/media/service");
    const r = await requestUpload(a.u.id, free.id, {
      kind: "PHOTO",
      slot: "qris",
      contentType: "image/jpeg",
      size: 1200,
    });
    const raw = path.join(UPLOADS, `raw/${a.u.id}/${r.mediaId}`);
    fs.mkdirSync(path.dirname(raw), { recursive: true });
    fs.copyFileSync(f("palsu.jpg"), raw);
    const err = await finalizePhoto(a.u.id, r.mediaId).then(
      () => null,
      (e: unknown) => e,
    );
    check(
      err instanceof UploadError && /bukan foto/.test(err.message),
      "server: magic bytes bukan gambar → ditolak",
    );
    check(!fs.existsSync(raw), "server: file mentah yang ditolak dihapus");
  }
  await page.reload({ waitUntil: "networkidle0" });
  await openGroup(page, "Foto sampul");
  await (await fileInput(page, "Pilih Foto sampul (cover)")).uploadFile(f("raksasa.png"));
  if (await waitText(page, "Simpan potongan", 8000)) {
    await sleep(500);
    await clickText(page, "Simpan potongan");
  }
  // gambar 9000 px dipotong browser lebih dulu → yang sampai ke server sudah < 2400 px;
  // uji batas dimensi server lewat upload tanpa crop (QRIS) di bawah.
  await page.reload({ waitUntil: "networkidle0" });
  await openGroup(page, "Amplop digital");
  await (await fileInput(page, "Pilih QRIS (opsional)")).uploadFile(f("raksasa.png"));
  check(
    await waitText(page, "Maksimal 8000 px", 15000),
    "gambar 9000 px ditolak server (batas dimensi)",
  );

  console.log("Galeri: multi-pilih, batas paket, urutan, potong ulang");
  await page.reload({ waitUntil: "networkidle0" });
  await openGroup(page, "Galeri foto");
  await (
    await fileInput(page, "Pilih foto galeri")
  ).uploadFile(f("foto-1.jpg"), f("foto-2.jpg"), f("foto-3.jpg"), f("foto-4.jpg"));
  await page
    .waitForFunction(`/[1-9][0-9]?%/.test(document.body.innerText)`, { timeout: 15000 })
    .catch(() => undefined);
  await scrollToText(page, "Antrean");
  await shot(page, "mobile-4-galeri-progres");
  check(
    await waitText(page, "4 foto dari maks. 6", 40000),
    "4 foto sekaligus terunggah (progres per foto)",
  );
  await (
    await fileInput(page, "Pilih foto galeri")
  ).uploadFile(f("foto-5.jpg"), f("foto-6.jpg"), f("foto-7.jpg"), f("foto-8.jpg"));
  check(await waitText(page, "Hanya 2 dari 4 foto", 8000), "kelebihan foto: pesan batas paket");
  check((await text(page)).includes("Lihat paket"), "tawaran upgrade ditampilkan");
  check(await waitText(page, "6 foto dari maks. 6", 40000), "galeri penuh di 6 foto (FREE)");
  await waitStatus(page, "Tersimpan", 20000);
  await sleep(800);
  await scrollToText(page, "foto dari maks.");
  await sleep(300);
  await shot(page, "mobile-5-galeri-penuh");
  const before = (await dataOf(free.id)).gallery.map((g) => g.url);
  check(before.length === 6, "data galeri berisi 6 foto");
  // Urutkan dengan keyboard: fokus foto 1 → Spasi → → → Spasi
  await page.focus('button[aria-label^="Foto 1."]');
  await page.keyboard.press("Space");
  await sleep(200);
  await page.keyboard.press("ArrowRight");
  await sleep(200);
  await page.keyboard.press("Space");
  await waitStatus(page, "Tersimpan", 15000);
  await sleep(500);
  const after = (await dataOf(free.id)).gallery.map((g) => g.url);
  check(
    after[0] === before[1] && after[1] === before[0],
    "urutan galeri berubah (keyboard) & tersimpan",
  );
  await clickText(page, "Atur potongan");
  await waitText(page, "Simpan potongan");
  await sleep(600);
  await shot(page, "mobile-6-potong-galeri");
  await clickText(page, "1:1", '[role="radio"]');
  await sleep(300);
  await clickText(page, "Simpan potongan");
  await waitDb(async () => (await dataOf(free.id)).gallery[0]?.url !== after[0]);
  await waitDb(async () => !fs.existsSync(fileOf(after[0])), 10000);
  const cropped = (await dataOf(free.id)).gallery;
  const m1 = await sharp(fs.readFileSync(fileOf(cropped[0].url))).metadata();
  check(
    cropped.length === 6 && cropped[0].url !== after[0] && m1.width === m1.height,
    "potong ulang 1:1 menggantikan foto (jumlah tetap 6)",
  );
  check(!fs.existsSync(fileOf(after[0])), "file sebelum dipotong ulang terhapus");

  console.log("Musik");
  await openGroup(page, "Musik");
  check(
    (await text(page)).includes("tersedia mulai paket Basic"),
    "paket Gratis: unggah musik → tawaran upgrade",
  );
  await scrollToText(page, "Unggah musik sendiri");
  await sleep(300);
  await shot(page, "mobile-7-musik-free");
  await page.goto(edit(basic.id), { waitUntil: "networkidle0" });
  await openGroup(page, "Musik");
  const disabled = await page.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Pilih file musik"))?.disabled`,
  );
  check(disabled === true, "tanpa centang persetujuan → tombol unggah nonaktif");
  await page.evaluate(
    `[...document.querySelectorAll("label")].find((l) => l.textContent.includes("bertanggung jawab"))?.querySelector("input")?.click()`,
  );
  await sleep(200);
  await (await fileInput(page, "Pilih file musik")).uploadFile(f("palsu.mp3"));
  check(await waitText(page, "bukan musik", 15000), "file teks bernama .mp3 ditolak (magic bytes)");
  await (await fileInput(page, "Pilih file musik")).uploadFile(f("lagu.mp3"));
  check(await waitText(page, "sedang diproses", 15000), 'status "sedang diproses…" tampil');
  await scrollToText(page, "sedang diproses");
  await sleep(300);
  await shot(page, "mobile-8-musik-proses");
  const ready = await page
    .waitForFunction(`!document.body.innerText.includes("sedang diproses")`, { timeout: 90000 })
    .then(() => true)
    .catch(() => false);
  check(ready, "proses asinkron selesai & musik otomatis dipilih");
  await waitStatus(page, "Tersimpan", 15000);
  await scrollToText(page, "Musik saya");
  await sleep(300);
  await shot(page, "mobile-9-musik-siap");
  const aud = await db.media.findFirst({
    where: { invitationId: basic.id, kind: "AUDIO" },
    orderBy: { createdAt: "desc" },
  });
  check(
    aud?.status === "READY" && !!aud.rightsAcceptedAt,
    "Media READY + waktu persetujuan hak lagu tersimpan",
  );
  const m4a = aud?.key ? path.join(UPLOADS, aud.key) : "";
  let info = "";
  try {
    execFileSync((await import("ffmpeg-static")).default as unknown as string, [
      "-hide_banner",
      "-i",
      m4a,
    ]);
  } catch (e) {
    info = String((e as { stderr?: Buffer }).stderr ?? "");
  }
  check(
    /Audio: aac/.test(info) && /9[0-9] kb\/s/.test(info),
    `hasil AAC ±96 kbps (${/Audio: [^\n]+/.exec(info)?.[0].slice(0, 60) ?? "?"})`,
  );
  check(
    ((await dataOf(basic.id)).music?.tracks[0]?.url ?? "") === `/media/${aud?.key}`,
    "musik terpasang di data undangan",
  );
  check(
    !aud?.rawKey && !fs.existsSync(path.join(UPLOADS, "raw", a.u.id, aud!.id)),
    "file mentah musik dihapus",
  );

  console.log("Kuota akun & akses");
  await db.media.create({
    data: {
      userId: c.u.id,
      invitationId: invC.id,
      kind: "PHOTO",
      slot: "gallery",
      status: "READY",
      key: "m/dummy/penuh.webp",
      bytes: 50 * 1024 * 1024 - 20 * 1024,
    },
  });
  const pc = await browser.newPage();
  await pc.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pc.setCookie({
    name: COOKIE,
    value: c.token,
    domain: new URL(base).hostname,
    path: "/",
    httpOnly: true,
  });
  await pc.goto(edit(invC.id), { waitUntil: "networkidle0" });
  await openGroup(pc, "Mempelai");
  await (await fileInput(pc, "Pilih Foto", 0)).uploadFile(f("foto-3.jpg"));
  await waitText(pc, "Simpan potongan");
  await sleep(500);
  await clickText(pc, "Simpan potongan");
  check(await waitText(pc, "Kuota penyimpanan penuh", 15000), "kuota akun penuh → pesan jelas");
  check((await text(pc)).includes("Lihat paket"), "kuota penuh → tawaran upgrade");
  await pc.screenshot({ path: `${shots ?? TMP}/mobile-10-kuota.png` });
  // user C mencoba meminta upload ke undangan user A (argumen action dirusak)
  await pc.setRequestInterception(true);
  pc.on("request", (r: HTTPRequest) => {
    if (
      r.method() === "POST" &&
      r.headers()["next-action"] &&
      (r.postData() ?? "").includes(invC.id)
    )
      return void r.continue({ postData: (r.postData() ?? "").replace(invC.id, free.id) });
    void r.continue();
  });
  await (await fileInput(pc, "Pilih Foto", 1)).uploadFile(f("foto-4.jpg"));
  await waitText(pc, "Simpan potongan");
  await sleep(500);
  await clickText(pc, "Simpan potongan");
  check(
    await waitText(pc, "Undangan tidak ditemukan", 15000),
    "upload ke undangan orang lain ditolak server",
  );
  check(
    (await db.media.count({ where: { userId: c.u.id, invitationId: free.id } })) === 0,
    "tidak ada file user C di undangan user A",
  );

  console.log("Pembersihan file mentah 24 jam");
  const stale = await db.media.create({
    data: {
      userId: a.u.id,
      invitationId: free.id,
      kind: "PHOTO",
      slot: "gallery",
      status: "UPLOADING",
      bytes: 1000,
    },
  });
  const staleKey = `raw/${a.u.id}/${stale.id}`;
  fs.mkdirSync(path.join(UPLOADS, "raw", a.u.id), { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, staleKey), "mentah");
  await db.media.update({ where: { id: stale.id }, data: { rawKey: staleKey } });
  await db.$executeRaw`UPDATE "Media" SET "createdAt" = now() - interval '25 hours' WHERE id = ${stale.id}`;
  execFileSync("pnpm", ["-s", "media:cleanup"], { stdio: "ignore" });
  check(
    !(await db.media.findUnique({ where: { id: stale.id } })) &&
      !fs.existsSync(path.join(UPLOADS, staleKey)),
    "upload > 24 jam yang tidak di-finalize dibersihkan",
  );

  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(failed ? `\n✗ ${failed} pemeriksaan gagal` : "\n✓ Semua pemeriksaan lolos");
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
