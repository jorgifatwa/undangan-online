/**
 * Sinkronkan aset asli ke tema berdasarkan ASSET-AUDIT.md.
 *
 *   pnpm assets:sync
 *
 * Untuk tiap baris berstatus `free` atau `milik` yang punya "Slot tema":
 *   - gambar dikonversi ke WebP (dioptimalkan, maks 1600 px; animasi GIF/WebP
 *     dipertahankan), SVG disalin apa adanya (tetap tajam & kecil),
 *   - disimpan sebagai src/themes/{tema}/assets/{slot}.{webp|svg}.
 * Lalu menulis src/themes/{tema}/assets/index.generated.ts (peta slot → file).
 * Baris `pro` / `belum dicek` → tidak disalin (tema memakai versi SVG).
 * File yang pernah dibuat script ini tapi statusnya kini tidak lagi
 * free/milik akan DIHAPUS. File lain di folder assets tidak disentuh.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { AUDIT_FILE, REFERENCES, type ReferenceSite } from "./lib/reference";

type Theme = ReferenceSite["theme"];
const ALLOWED = new Set(["free", "milik"]);

/**
 * Ukuran maksimum (sisi terpanjang, px) per slot, sesuai ukuran tampil di kolom
 * 440 px pada layar 3× (cukup tajam, tidak boros). Default 1400.
 * Next/Image tetap membuat varian lebih kecil per perangkat dari file ini.
 */
const MAX_SIDE: Record<string, number> = {
  butterfly: 320, // tampil ±55 px
  "wax-seal": 400,
  "wax-seal-gold": 400,
  heart: 400,
  "sparkle-star": 300,
  tassel: 700,
  "tassel-alt": 700,
  "calla-divider": 700,
  vinyl: 600,
  "city-tree-left": 400,
  "city-tree-right": 400,
  "lace-doily": 1300,
  "lace-card": 560, // border-image (file dikirim apa adanya); irisan diskalakan di tema
};
/** Latar penuh: sedikit lebih kompres (tekstur menyamarkan artefak). */
const TEXTURE = new Set(["drape-bg", "velvet-bg", "suede-bg", "leaf-bg", "card-texture"]);
const HEADER =
  "// FILE DIBUAT OTOMATIS oleh scripts/assets-sync.ts dari ASSET-AUDIT.md — jangan diedit manual.\n";

interface Row {
  theme: Theme;
  id: string;
  file: string;
  slot: string | null;
  status: string;
}

async function parseAudit(): Promise<Row[]> {
  const text = await fs.readFile(AUDIT_FILE, "utf8");
  const rows: Row[] = [];
  let theme: Theme | null = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("## Tirai Beludru")) theme = "tirai-beludru";
    else if (line.startsWith("## Renda Rimba")) theme = "renda-rimba";
    if (!theme || !line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    const id = cells[0]?.replace(/`/g, "");
    if (!/^(tb|rr)-/.test(id ?? "")) continue;
    // Kolom: ID | File | Dimensi | Peran | Section | Slot | SVG | Sama dengan | Status | Catatan
    const slot = cells[5]?.replace(/`/g, "");
    rows.push({
      theme,
      id,
      file: cells[1].replace(/`/g, ""),
      slot: slot && slot !== "—" ? slot : null,
      status: (cells[8] ?? "").toLowerCase(),
    });
  }
  return rows;
}

const camel = (s: string) =>
  s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/^[^a-z]/i, "a");

async function previouslyGenerated(dir: string): Promise<string[]> {
  try {
    const text = await fs.readFile(path.join(dir, "index.generated.ts"), "utf8");
    const m = text.match(/GENERATED_FILES = (\[[^\]]*\])/);
    return m ? (JSON.parse(m[1]) as string[]) : [];
  } catch {
    return [];
  }
}

async function syncTheme(theme: Theme, rows: Row[]) {
  const ref = REFERENCES.find((r) => r.theme === theme)!;
  const dir = path.join(process.cwd(), "src/themes", theme, "assets");
  await fs.mkdir(dir, { recursive: true });
  const before = await previouslyGenerated(dir);

  const chosen = new Map<string, Row>(); // slot → baris (yang pertama menang)
  for (const r of rows) {
    if (r.theme !== theme || !r.slot || !ALLOWED.has(r.status)) continue;
    if (/\.json$/i.test(r.file)) {
      console.log(
        `  · ${r.id}: Lottie dilewati (tema memakai <Sparkles> SVG; tidak menambah library Lottie)`,
      );
      continue;
    }
    if (!chosen.has(r.slot)) chosen.set(r.slot, r);
  }

  // Aset animasi (GIF/WebP animasi) tidak bisa diimpor statis (pemroses gambar
  // Next/Turbopack tidak mendukung) → disimpan di public/theme-assets/{tema}/ dan
  // dirujuk lewat URL + ukuran; disajikan tanpa optimasi ulang (animasi tetap).
  const pubDir = path.join(process.cwd(), "public/theme-assets", theme);
  const written: string[] = []; // path relatif ke root proyek (untuk penghapusan)
  let totalSrc = 0;
  let totalOut = 0;
  const imports: string[] = [];
  const entries: string[] = [];
  for (const [slot, r] of [...chosen].sort(([a], [b]) => a.localeCompare(b))) {
    const src = path.join(ref.dir, r.file);
    const isSvg = /\.svg$/i.test(r.file);
    const meta = isSvg ? null : await sharp(src, { animated: true }).metadata();
    const animated = (meta?.pages ?? 1) > 1;
    let out: string;
    if (isSvg) {
      out = path.join(dir, `${slot}.svg`);
      await fs.copyFile(src, out);
      imports.push(`import ${camel(slot)} from "./${slot}.svg";`);
      entries.push(`  "${slot}": ${camel(slot)},`);
    } else if (animated) {
      await fs.mkdir(pubDir, { recursive: true });
      out = path.join(pubDir, `${slot}.anim.webp`);
      await sharp(src, { animated: true })
        .resize({
          width: MAX_SIDE[slot] ?? 480,
          height: MAX_SIDE[slot] ?? 480,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78, alphaQuality: 90, effort: 6 })
        .toFile(out);
      const m = await sharp(out, { animated: true }).metadata();
      entries.push(
        `  "${slot}": { src: "/theme-assets/${theme}/${slot}.anim.webp", width: ${m.width}, height: ${m.pageHeight ?? m.height} },`,
      );
    } else {
      out = path.join(dir, `${slot}.webp`);
      // Hasil harus lebih kecil dari sumber; bila tidak (mis. JPG tekstur penuh
      // noise), turunkan kualitas bertahap sampai 64.
      const srcBytes = (await fs.stat(src)).size;
      let q = slot === "leaf-bg" ? 86 : TEXTURE.has(slot) ? 80 : 84;
      for (;;) {
        await sharp(src)
          .resize({
            width: MAX_SIDE[slot] ?? 1400,
            height: MAX_SIDE[slot] ?? 1400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: q, alphaQuality: 90, smartSubsample: true, effort: 6 })
          .toFile(out);
        if ((await fs.stat(out)).size < srcBytes * 0.9 || q <= 64) break;
        q -= 6;
      }
      imports.push(`import ${camel(slot)} from "./${slot}.webp";`);
      entries.push(`  "${slot}": ${camel(slot)},`);
    }
    const rel = path.relative(process.cwd(), out);
    const kb = Math.round((await fs.stat(out)).size / 1024);
    const srcKb = Math.round((await fs.stat(src)).size / 1024);
    totalSrc += srcKb;
    totalOut += kb;
    console.log(`  ✓ ${r.id} → ${rel}: ${srcKb} KB → ${kb} KB${animated ? " (animasi)" : ""}`);
    written.push(rel);
  }

  for (const old of before) {
    if (!written.includes(old)) {
      await fs.rm(path.join(process.cwd(), old), { force: true });
      console.log(`  ✗ dihapus: ${old} (status bukan free/milik lagi)`);
    }
  }

  const file = written.length
    ? `${HEADER}import type { ThemeAssets } from "../../_shared/assets";\n${imports.length ? `\n${imports.join("\n")}\n` : ""}\nexport const THEME_ASSETS: ThemeAssets = {\n${entries.join("\n")}\n};\n\nexport const GENERATED_FILES = ${JSON.stringify(written)};\n`
    : `${HEADER}import type { ThemeAssets } from "../../_shared/assets";\n\n/** Belum ada aset berstatus free/milik → tema memakai versi SVG. */\nexport const THEME_ASSETS: ThemeAssets = {};\n\nexport const GENERATED_FILES = [];\n`;
  await fs.writeFile(path.join(dir, "index.generated.ts"), file);
  console.log(
    `▶ ${theme}: ${written.length} aset asli dipakai, sisanya SVG — total ${totalSrc} KB → ${totalOut} KB`,
  );
}

async function main() {
  const rows = await parseAudit();
  const counts = rows.reduce<Record<string, number>>(
    (acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc),
    {},
  );
  console.log(
    `Audit: ${rows.length} baris — ${Object.entries(counts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}`,
  );
  for (const ref of REFERENCES) await syncTheme(ref.theme, rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
