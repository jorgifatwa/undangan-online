/**
 * Uji end-to-end grup editor di SEMUA tema (development).
 *
 *   pnpm dev
 *   pnpm e2e:editor-grup [base-url]
 *
 *  - membuka setiap grup → pratinjau bergulir ke bagian terkait (undangan
 *    kosong: section yang belum dirender → section terdekat)
 *  - sakelar "Tampilkan bagian ini" di grup = data yang sama dengan grup
 *    "Urutan & tampilan section" (sinkron dua arah), section hilang dari
 *    pratinjau, urutan section lain tidak berubah
 *  - cerita ulang tahun / love story kosong → teks penanda di pratinjau pemilik,
 *    tidak di halaman tamu
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { encode } from "next-auth/jwt";
import type { Frame, Page } from "puppeteer-core";

import { buildInitialData } from "../src/lib/invitations/initial-data";
import { launchBrowser } from "./lib/browser";
import { assertSafeDatabase } from "./lib/guard";
import { purchased } from "./lib/purchase";

const base = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3001";
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  if (!ok) failed++;
};
const THEMES = (
  process.env.ONLY
    ? [process.env.ONLY]
    : ["pita-krayon", "confetti-party", "tirai-beludru", "renda-rimba"]
) as string[];
const BDAY = new Set(["pita-krayon", "confetti-party"]);

async function groupButtons(p: Page) {
  return p.$$("button[aria-expanded]");
}
async function openGroup(p: Page, title: string) {
  const i = (await p.$$eval(
    "button[aria-expanded]",
    (bs, t) => bs.findIndex((b) => b.textContent!.trim().startsWith(t as string)),
    title,
  )) as number;
  const btn = (await groupButtons(p))[i];
  if ((await btn.evaluate((x) => x.getAttribute("aria-expanded"))) !== "true") await btn.click();
  await sleep(600);
}
const sectionIds = (f: Frame) =>
  f.$$eval("[data-inv-section]", (els) => els.map((e) => e.getAttribute("data-inv-section")));

async function main() {
  assertSafeDatabase("e2e-editor-grup");
  const u = await db.user.upsert({
    where: { email: "e2e-grup@test.local" },
    update: {},
    create: { email: "e2e-grup@test.local", name: "Uji Grup" },
  });
  const token = await encode({
    token: { sub: u.id, id: u.id, name: u.name, email: u.email, role: "USER" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const date = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
  const browser = await launchBrowser();

  for (const theme of THEMES) {
    console.log(`Tema ${theme}`);
    const bday = BDAY.has(theme);
    const slug = `uji-grup-${theme}`;
    await db.invitation.deleteMany({ where: { slug } });
    const data = (
      bday
        ? buildInitialData({
            eventType: "BIRTHDAY",
            name: "Kirana Putri",
            nickname: "Kirana",
            age: 17,
            date,
            timezone: "WIB",
            city: "Jakarta",
            themeId: theme,
          })
        : buildInitialData({
            eventType: "WEDDING",
            brideName: "Sekar Ayu",
            brideNickname: "Sekar",
            groomName: "Raka Aditya",
            groomNickname: "Raka",
            date,
            timezone: "WIB",
            city: "Bandung",
            greeting: "umum",
            themeId: theme,
          })
    ).data;
    const inv = await db.invitation.create({
      data: {
        userId: u.id,
        slug,
        eventType: bday ? "BIRTHDAY" : "WEDDING",
        themeId: theme,
        ...purchased(theme),
        status: "PUBLISHED",
        publishedAt: new Date(),
        data: data as Prisma.InputJsonValue,
      },
    });
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.setCookie({
      name: "authjs.session-token",
      value: token,
      domain: new URL(base).hostname,
      path: "/",
      httpOnly: true,
    });
    await p.goto(`${base}/dashboard/undangan/${inv.id}/edit`, {
      waitUntil: "networkidle0",
      timeout: 120000,
    });
    await sleep(2500);
    const frame = p.frames().find((f) => f.url().includes("/pratinjau"))!;

    // 1. setiap grup menggulir pratinjau
    const n = (await groupButtons(p)).length;
    const still: string[] = [];
    // mulai sekali dari paling atas & sekali dari paling bawah: tujuan akhir harus
    // sama (deterministik) dan minimal satu kali benar-benar bergeser
    const landing = async (k: number, from: string) => {
      await frame.evaluate(`window.scrollTo({ top: ${from}, behavior: "instant" })`);
      await sleep(250);
      const before = (await frame.evaluate("window.scrollY")) as number;
      const btn = (await groupButtons(p))[k];
      if ((await btn.evaluate((x) => x.getAttribute("aria-expanded"))) === "true")
        await btn.click();
      await btn.click();
      await sleep(1300);
      const after = (await frame.evaluate("window.scrollY")) as number;
      return { moved: Math.abs(after - before) > 20, after };
    };
    for (let k = 0; k < n; k++) {
      const title = (await (
        await groupButtons(p)
      )[k].evaluate((x) => x.firstElementChild?.textContent ?? "")) as string;
      const a = await landing(k, "0");
      const b = await landing(k, "document.documentElement.scrollHeight");
      if (!(a.moved || b.moved) || Math.abs(a.after - b.after) > 20) still.push(title);
    }

    // 1b. panel isian ikut bergulir halus: grup terbuka berada di atas panel
    {
      const form = (await p.$("form"))!;
      await form.evaluate((f) => f.scrollTo({ top: 0, behavior: "instant" }));
      await sleep(200);
      const i = (await p.$$eval("button[aria-expanded]", (bs) =>
        bs.findIndex((b) => b.textContent!.trim().startsWith("Galeri foto")),
      )) as number;
      await (await groupButtons(p))[i].click();
      await sleep(80);
      const mid = (await form.evaluate((f) => f.scrollTop)) as number;
      await sleep(1200);
      const end = (await form.evaluate((f) => f.scrollTop)) as number;
      const off = (await p.evaluate(`(() => {
        const f = document.querySelector("form"), g = document.querySelector("[data-group-open]");
        return Math.round(g.getBoundingClientRect().top - f.getBoundingClientRect().top);
      })()`)) as number;
      const max = (await form.evaluate((f) => f.scrollHeight - f.clientHeight)) as number;
      // grup di dekat akhir daftar: panel mentok di bawah → cukup kepalanya terlihat
      const ch = (await form.evaluate((f) => f.clientHeight)) as number;
      check(
        (off >= 0 && off <= 30) || (end >= max - 2 && off >= 0 && off < ch - 60),
        `grup yang dibuka digulir ke atas panel isian (jarak ${off}px, mentok bawah: ${end >= max - 2})`,
      );
      check(mid > 0 && mid < end, `gulir panel isian bertahap/smooth (${mid}px → ${end}px)`);
    }
    check(
      still.length === 0,
      `${n} grup menggulir pratinjau${still.length ? ` (diam: ${still.join(", ")})` : ""}`,
    );

    {
      const form = (await p.$("form"))!;
      await form.evaluate((f) => f.scrollTo({ top: 0, behavior: "instant" }));
      await openGroup(p, "Acara");
      await sleep(900);
      const off = (await p.evaluate(`(() => {
        const f = document.querySelector("form"), g = document.querySelector("[data-group-open]");
        return Math.round(g.getBoundingClientRect().top - f.getBoundingClientRect().top);
      })()`)) as number;
      check(
        off >= 0 && off <= 30,
        `grup tengah (Acara) tepat di atas panel isian (jarak ${off}px)`,
      );
    }

    // 2. sakelar tampil/sembunyi di grup (Galeri) ⇄ grup Urutan
    await openGroup(p, "Galeri foto");
    const sw = await p.$('[data-testid="section-visibility"] input');
    check(!!sw, "grup Galeri punya sakelar “Tampilkan bagian ini di undangan”");
    if (theme === "pita-krayon") {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(".reference/report/tema-baru", { recursive: true });
      await p.screenshot({ path: ".reference/report/tema-baru/grup-galeri-toggle.png" });
    }
    const orderBefore = (await sectionIds(frame)).filter((x) => x !== "galeri");
    await sw!.click();
    await sleep(1800);
    const hidden = await sectionIds(frame);
    check(!hidden.includes("galeri"), "sakelar mati → bagian galeri hilang dari pratinjau");
    check(hidden.join() === orderBefore.join(), "urutan section lain tidak berubah");
    await openGroup(p, "Urutan & tampilan section");
    if (theme === "pita-krayon") {
      await p.screenshot({ path: ".reference/report/tema-baru/grup-urutan-toggle.png" });
    }
    const inUrutan = await p.evaluate(`document.body.innerText.includes("disembunyikan")`);
    check(!!inUrutan, "grup Urutan & judul grup ikut menandai “disembunyikan”");
    await openGroup(p, "Galeri foto");
    await (await p.$('[data-testid="section-visibility"] input'))!.click();
    await sleep(1800);
    check((await sectionIds(frame)).includes("galeri"), "sakelar nyala → galeri tampil lagi");
    const saved = await (async () => {
      for (let i = 0; i < 20; i++) {
        const d = (await db.invitation.findUniqueOrThrow({ where: { id: inv.id } })).data as {
          sections?: { id: string; visible: boolean }[];
        };
        if (d.sections?.find((s) => s.id === "galeri")?.visible === true) return true;
        await sleep(500);
      }
      return false;
    })();
    check(saved, "tersimpan di data.sections (sama dengan grup Urutan)");

    // 2b. pilihan ilustrasi bangunan (tema dengan editorFields "venueArt")
    if (theme === "tirai-beludru") {
      await openGroup(p, "Acara");
      const pick = async (v: string) => {
        await (await p.$(`[data-testid="venue-art"] input[value="${v}"]`))!.evaluate((x) =>
          (x.closest("label") as HTMLElement).click(),
        );
        await sleep(2000);
        return (await frame.evaluate(
          `[...document.querySelectorAll('[data-inv-section="acara"] img')].map((i) => i.src).join(" ")`,
        )) as string;
      };
      const rumah = await pick("rumah");
      check(
        rumah.includes("venue-mansion") && !rumah.includes("city-tower"),
        "pilih “Rumah” → pratinjau menampilkan ilustrasi rumah",
      );
      const kota = await pick("kota");
      check(
        kota.includes("city-tower") && !kota.includes("venue-mansion"),
        "pilih “Gedung kota” → kembali ke ilustrasi gedung kota",
      );
    }

    // 2c. foto pernikahan: hanya isian yang dipakai tema, di grup section tempat
    // foto itu tampil (cover → grup Foto sampul sebelum Mempelai, strip → Mempelai,
    // foto penutup → Penutup)
    if (!bday) {
      const titles = (await p.$$eval("button[aria-expanded]", (bs) =>
        bs.map((b) => b.firstElementChild?.textContent?.trim() ?? ""),
      )) as string[];
      const groupText = async (title: string) => {
        await openGroup(p, title);
        return (await p.evaluate(
          `document.querySelector("[data-group-open]")?.innerText ?? ""`,
        )) as string;
      };
      const mempelai = await groupText("Mempelai");
      const penutup = await groupText("Penutup");
      if (theme === "tirai-beludru") {
        check(
          !titles.includes("Foto sampul (cover)"),
          "Tirai: tanpa grup Foto sampul (tidak dipakai)",
        );
        check(
          mempelai.includes("Foto") && !mempelai.includes("Photo strip"),
          "Tirai: Mempelai berisi foto mempelai, tanpa photo strip",
        );
        check(!penutup.includes("Foto penutup"), "Tirai: Penutup tanpa foto penutup");
      } else {
        const iFoto = titles.indexOf("Foto sampul (cover)");
        check(
          iFoto >= 0 && iFoto < titles.indexOf("Mempelai"),
          "Renda: grup “Foto sampul (cover)” ada, sebelum Mempelai (urutan pratinjau)",
        );
        check(
          mempelai.includes("Photo strip 1") && !/\nFoto\n/.test(mempelai),
          "Renda: photo strip di grup Mempelai, tanpa foto mempelai perorangan",
        );
        check(penutup.includes("Foto penutup"), "Renda: foto penutup di grup Penutup");
      }
    }

    // 3. penanda teks cerita / love story (pratinjau pemilik saja)
    const textKey = bday ? "Tulis cerita ulang tahunmu" : "Isi kisah kalian";
    const sec = bday ? "cerita" : "loveStory";
    if ((await frame.$(`[data-inv-section="${sec}"]`)) || bday) {
      const shown = (await frame.evaluate(
        `document.body.innerText.includes(${JSON.stringify(textKey)})`,
      )) as boolean;
      const supported = !!(await frame.$(`[data-inv-section="${sec}"]`));
      check(!supported || shown, `${sec} kosong → teks penanda di pratinjau pemilik`);
    }
    const guest = await (await fetch(`${base}/${slug}`)).text();
    check(
      !guest.includes(textKey) && !guest.includes("foto-kosong.svg"),
      "halaman tamu tanpa penanda",
    );
    await p.close();

    // 2d. Tirai + photo strip yang terlanjur diunggah: isiannya tetap tampil di
    // grup Mempelai (bisa dihapus) dengan keterangan "tidak tampil di tema ini". Halaman editor baru
    // agar tidak bentrok dengan simpan otomatis halaman sebelumnya.
    if (theme === "tirai-beludru") {
      await sleep(3000); // simpan otomatis terakhir selesai
      const d = (await db.invitation.findUniqueOrThrow({ where: { id: inv.id } })).data as Record<
        string,
        Record<string, unknown>
      >;
      await db.invitation.update({
        where: { id: inv.id },
        data: {
          data: {
            ...d,
            photos: { ...d.photos, strip: [{ url: "/placeholders/foto-kosong.svg" }] },
          } as Prisma.InputJsonValue,
        },
      });
      const q = await browser.newPage();
      await q.setViewport({ width: 1280, height: 900 });
      await q.goto(`${base}/dashboard/undangan/${inv.id}/edit`, {
        waitUntil: "networkidle0",
        timeout: 120000,
      });
      await sleep(2000);
      const title = (await q.$$eval("button[aria-expanded]", (bs) =>
        bs.map((b) => b.textContent!.trim()).find((t) => t.startsWith("Mempelai")),
      )) as string | undefined;
      await openGroup(q, "Mempelai");
      const txt = (await q.evaluate(
        `document.querySelector("[data-group-open]")?.innerText ?? ""`,
      )) as string;
      check(
        !!title && txt.includes("Photo strip 1") && txt.includes("Tidak tampil di tema ini."),
        "Tirai + photo strip lama: tampil di Mempelai dengan keterangan “tidak tampil di tema ini”",
      );
      await q.close();
    }
  }

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
