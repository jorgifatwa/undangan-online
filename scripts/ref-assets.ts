/**
 * Inventaris aset gambar referensi.
 *
 *   pnpm ref:assets
 *
 * 1. Memindai semua gambar (+ Lottie) di folder referensi kedua tema.
 * 2. Membuat thumbnail → public/_ref/assets/{id}.webp (gitignored).
 * 3. Membuka versi LIVE referensi, mencari tiap aset di DOM, menentukan
 *    section-nya, dan memotret posisinya (aset disorot) →
 *    public/_ref/positions/{id}.webp (gitignored).
 * 4. Menulis .reference/assets.json (dibaca /preview/aset-referensi) dan
 *    memperbarui src/themes/ASSET-AUDIT.md TANPA menimpa kolom Status &
 *    Catatan yang sudah diisi.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { launchBrowser } from "./lib/browser";
import {
  AUDIT_FILE,
  baseName,
  classify,
  IMAGE_EXT,
  JORGI_SECTION_LABELS,
  LOTTIE_EXT,
  OUT_DIR,
  PUBLIC_REF_DIR,
  REFERENCES,
  SCAN_DIRS,
  SKIP_PATH,
  SLOT_MAP,
  type ReferenceSite,
} from "./lib/reference";
import {
  collectAssetUsages,
  collectSections,
  contentHeight,
  openTall,
  REF_WIDTH,
} from "./lib/reference-page";

export interface AssetUsage {
  page: "cover" | "details";
  section: string;
  /** Path relatif public/ ke screenshot posisi. */
  position?: string;
}

export interface RefAsset {
  id: string;
  theme: ReferenceSite["theme"];
  file: string;
  absPath: string;
  base: string;
  kind: "image" | "lottie";
  bytes: number;
  width?: number;
  height?: number;
  sha1: string;
  thumb?: string;
  slot: string | null;
  svg: string;
  role: string;
  /** Komponen kode referensi yang memakainya. */
  codeRefs: string[];
  usages: AssetUsage[];
  /** Id aset yang sama di tema lain (nama media Canva atau isi file sama). */
  sharedWith: string[];
}

const PREFIX: Record<ReferenceSite["theme"], string> = {
  "tirai-beludru": "tb",
  "renda-rimba": "rr",
};

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import("node:fs").Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (SKIP_PATH.test(p)) continue;
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function sourceFiles(ref: ReferenceSite): Promise<{ file: string; text: string }[]> {
  const files = (await walk(path.join(ref.dir, "src"))).filter((f) =>
    /\.(tsx?|js|mjs|html)$/.test(f),
  );
  files.push(...(await walk(path.join(ref.dir, "public/css"))));
  return Promise.all(
    files.map(async (f) => ({
      file: path.relative(ref.dir, f),
      text: await fs.readFile(f, "utf8"),
    })),
  );
}

async function scan(ref: ReferenceSite): Promise<RefAsset[]> {
  const src = await sourceFiles(ref);
  const assets: RefAsset[] = [];
  for (const sub of SCAN_DIRS) {
    for (const abs of await walk(path.join(ref.dir, sub))) {
      const rel = path.relative(ref.dir, abs);
      const isImage = IMAGE_EXT.test(abs);
      const isLottie = LOTTIE_EXT.test(abs) && /(lottie|video)\//.test(rel);
      if (!isImage && !isLottie) continue;
      const buf = await fs.readFile(abs);
      const base = baseName(abs);
      const short = /^[0-9a-f]{32}$/.test(base)
        ? base.slice(0, 8)
        : base.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      const map = SLOT_MAP[ref.theme][base];
      let width: number | undefined;
      let height: number | undefined;
      if (isImage) {
        try {
          const m = await sharp(buf).metadata();
          width = m.width;
          height = m.pageHeight ?? m.height;
        } catch {
          /* .ico dll. */
        }
      }
      assets.push({
        id: `${PREFIX[ref.theme]}-${short}`,
        theme: ref.theme,
        file: rel,
        absPath: abs,
        base,
        kind: isImage ? "image" : "lottie",
        bytes: buf.length,
        width,
        height,
        sha1: crypto.createHash("sha1").update(buf).digest("hex"),
        slot: map?.slot ?? null,
        svg: map?.svg ?? "—",
        role: map?.role ?? classify(rel),
        codeRefs: src.filter((s) => s.text.includes(base)).map((s) => path.basename(s.file)),
        usages: [],
        sharedWith: [],
      });
    }
  }
  return assets.sort((a, b) => a.file.localeCompare(b.file));
}

async function thumbnails(assets: RefAsset[]) {
  const dir = path.join(PUBLIC_REF_DIR, "assets");
  await fs.mkdir(dir, { recursive: true });
  for (const a of assets) {
    if (a.kind !== "image") continue;
    try {
      await sharp(await fs.readFile(a.absPath))
        .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(dir, `${a.id}.webp`));
      a.thumb = `/_ref/assets/${a.id}.webp`;
    } catch (e) {
      console.warn(`  ! thumbnail gagal ${a.file}: ${(e as Error).message}`);
    }
  }
}

/** Potret posisi tiap aset di halaman live (aset disorot, sisanya digelapkan). */
async function positions(ref: ReferenceSite, assets: RefAsset[]) {
  const dir = path.join(PUBLIC_REF_DIR, "positions");
  await fs.mkdir(dir, { recursive: true });
  const browser = await launchBrowser();
  try {
    for (const kind of ["cover", "details"] as const) {
      const url = `${ref.liveUrl}${kind === "cover" ? ref.coverPath : ref.detailsPath}`;
      process.stdout.write(`  ${ref.theme} ${kind}: ${url}\n`);
      const probe = await openTall(browser, url, 900, 2500);
      const h = kind === "cover" ? 900 : Math.min(16000, (await contentHeight(probe)) + 200);
      await probe.close();
      const page = await openTall(browser, url, h, 6000);

      const sections = await collectSections(page, kind);
      const usages = await collectAssetUsages(page);
      // Kelompokkan per (aset, section); simpan pemakaian terbesar tiap section.
      const sectionOf = (y: number) =>
        sections.find((s) => y >= s.top && y < s.top + s.height) ?? sections[sections.length - 1];
      const byKey = new Map<
        string,
        { u: (typeof usages)[number]; sec: (typeof sections)[number] }
      >();
      for (const u of usages) {
        const sec = sectionOf(u.rect.y + u.rect.height / 2);
        const key = `${u.base}::${sec.key}`;
        const prev = byKey.get(key);
        if (!prev || u.rect.width * u.rect.height > prev.u.rect.width * prev.u.rect.height)
          byKey.set(key, { u, sec });
      }

      for (const a of assets) {
        const hits = [...byKey.entries()]
          .filter(([k]) => k.startsWith(`${a.base}::`))
          .map(([, v]) => v);
        for (const { u, sec } of hits) {
          const cy = u.rect.y + u.rect.height / 2;
          const label =
            kind === "cover"
              ? ref.theme === "tirai-beludru"
                ? JORGI_SECTION_LABELS.cover
                : "Cover"
              : (JORGI_SECTION_LABELS[sec.label] ?? sec.label);
          const slug = sec.key.replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "s";

          // Jendela potret: section (maks 1000 px) yang memuat aset.
          const winH = Math.min(sec.height || 900, 1000);
          const top = Math.max(
            sec.top,
            Math.min(cy - winH / 2, sec.top + (sec.height || winH) - winH),
          );
          const out = path.join(dir, `${a.id}-${kind}-${slug}.webp`);
          await page.evaluate(
            `(() => {
            const d = document.createElement("div");
            d.id = "__ref_hl";
            Object.assign(d.style, { position: "absolute", left: "${u.rect.x - 3}px", top: "${u.rect.y - 3}px", width: "${u.rect.width + 6}px", height: "${u.rect.height + 6}px", outline: "3px solid #ff2d55", boxShadow: "0 0 0 9999px rgba(0,0,0,.45)", zIndex: 2147483647, pointerEvents: "none", borderRadius: "4px" });
            document.body.appendChild(d);
          })()`,
          );
          const png = await page.screenshot({
            clip: { x: 0, y: Math.max(0, top), width: REF_WIDTH, height: winH },
            captureBeyondViewport: true,
          });
          await page.evaluate(`document.getElementById("__ref_hl")?.remove()`);
          await sharp(png).webp({ quality: 74 }).toFile(out);
          a.usages.push({
            page: kind,
            section: label,
            position: `/_ref/positions/${a.id}-${kind}-${slug}.webp`,
          });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

/* ------------------------------ ASSET-AUDIT.md ----------------------------- */

const STATUS_VALUES = ["belum dicek", "free", "pro", "milik"] as const;

/** Baca status & catatan yang sudah diisi pemilik (kolom terakhir tabel). */
async function readExistingAudit(): Promise<Map<string, { status: string; note: string }>> {
  const map = new Map<string, { status: string; note: string }>();
  let text = "";
  try {
    text = await fs.readFile(AUDIT_FILE, "utf8");
  } catch {
    return map;
  }
  for (const line of text.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const id = cells[1]?.replace(/`/g, "");
    if (!/^(tb|rr)-/.test(id ?? "")) continue;
    const status = cells[cells.length - 3];
    const note = cells[cells.length - 2];
    map.set(id, {
      status: STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])
        ? status
        : "belum dicek",
      note: note ?? "",
    });
  }
  return map;
}

function kb(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

async function writeAudit(assets: RefAsset[]) {
  const existing = await readExistingAudit();
  const rows = (theme: ReferenceSite["theme"]) =>
    assets
      .filter((a) => a.theme === theme)
      .map((a) => {
        const prev = existing.get(a.id);
        const sections =
          [...new Set(a.usages.map((u) => u.section))].join(", ") ||
          (a.kind === "lottie"
            ? `animasi Lottie (kode: ${a.codeRefs.slice(0, 2).join(", ")})`
            : a.codeRefs.length
              ? `tidak tampil — disembunyikan / hanya di kode: ${a.codeRefs.slice(0, 2).join(", ")}`
              : "tidak dipakai di halaman undangan");
        const dim = a.width ? `${a.width}×${a.height}` : "";
        return `| \`${a.id}\` | \`${a.file}\` | ${dim} · ${kb(a.bytes)} | ${a.role} | ${sections} | ${a.slot ? `\`${a.slot}\`` : "—"} | ${a.svg} | ${a.sharedWith.map((s) => `\`${s}\``).join(", ") || "—"} | ${prev?.status ?? "belum dicek"} | ${prev?.note ?? ""} |`;
      })
      .join("\n");

  const header =
    "| ID | File | Dimensi · ukuran | Peran | Dipakai di section | Slot tema | Pengganti SVG | Sama dengan | Status | Catatan |\n|---|---|---|---|---|---|---|---|---|---|";

  const md = `# Audit Aset Referensi

Daftar SEMUA gambar & animasi Lottie di folder referensi kedua tema. Isi kolom
**Status** dengan salah satu nilai berikut (huruf kecil, persis):

| Status | Arti | Dipakai di tema |
|---|---|---|
| \`belum dicek\` | default | versi SVG |
| \`free\` | elemen Free Canva — boleh dipakai aslinya | file asli (WebP) |
| \`pro\` | elemen Pro Canva — harus diganti | versi SVG |
| \`milik\` | buatan / upload sendiri — boleh dipakai aslinya | file asli (WebP) |

> ⚠️ Elemen *Free* Canva tetap tunduk pada Canva Content License, yang membatasi
> pemakaian di template/produk yang dijual atau didistribusikan ke pengguna lain.
> Pastikan ketentuannya sebelum menandai \`free\`.

Setelah mengisi, jalankan \`pnpm assets:sync\` → aset \`free\`/\`milik\` yang punya
**Slot tema** dikonversi ke WebP dan disalin ke \`src/themes/{tema}/assets/\`.
Kolom selain Status & Catatan dibuat ulang oleh \`pnpm ref:assets\`
(Status & Catatan yang sudah diisi DIPERTAHANKAN).

Pratinjau thumbnail & posisi tiap aset: **/preview/aset-referensi** (development).

## Tirai Beludru (referensi Jorgi)

${header}
${rows("tirai-beludru")}

## Renda Rimba (referensi Subagja)

${header}
${rows("renda-rimba")}
`;
  await fs.writeFile(AUDIT_FILE, md);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const all: RefAsset[] = [];
  for (const ref of REFERENCES) {
    console.log(`▶ ${ref.label}: memindai ${ref.dir}`);
    all.push(...(await scan(ref)));
  }

  // Aset sama di dua tema: nama media sama (Canva) atau isi file identik.
  for (const a of all) {
    // nama sama hanya dihitung untuk id media Canva (32 hex) — "icon", "favicon" dll. bukan aset yang sama
    const canvaId = /^[0-9a-f]{32}$/.test(a.base);
    a.sharedWith = all
      .filter((b) => b.theme !== a.theme && ((canvaId && b.base === a.base) || b.sha1 === a.sha1))
      .map((b) => b.id);
  }

  console.log("▶ thumbnail");
  await thumbnails(all);

  if (!process.argv.includes("--no-live")) {
    for (const ref of REFERENCES) {
      console.log(`▶ posisi aset (live): ${ref.label}`);
      await positions(
        ref,
        all.filter((a) => a.theme === ref.theme),
      );
    }
  }

  // absPath (path lokal mesin ini) tidak ikut disimpan
  const json = all.map((a) =>
    Object.fromEntries(Object.entries(a).filter(([k]) => k !== "absPath")),
  );
  await fs.writeFile(
    path.join(OUT_DIR, "assets.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), width: REF_WIDTH, assets: json },
      null,
      2,
    ),
  );
  await writeAudit(all);

  const located = all.filter((a) => a.usages.length > 0).length;
  console.log(
    `✓ ${all.length} aset (${located} ditemukan di halaman live) → .reference/assets.json, ${path.relative(process.cwd(), AUDIT_FILE)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
