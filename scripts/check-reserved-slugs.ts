/**
 * Pastikan setiap rute top-level website & isi public/ tercantum di daftar
 * slug terlarang (src/lib/invitations/reserved.ts). Undangan tampil di
 * domain/{slug}, jadi rute baru yang lupa didaftarkan bisa bentrok dengan
 * undangan yang sudah ada / dibuat nanti.
 *
 *   pnpm check:slugs           (otomatis lewat "prebuild" → build GAGAL bila ada yang kurang)
 *   tsx scripts/check-reserved-slugs.ts --app=<dir> --public=<dir>   (uji)
 *
 * Yang dikumpulkan:
 *  - folder di src/app (menembus route group "(nama)"); folder dinamis "[x]",
 *    privat "_x", dan slot "@x" dilewati
 *  - file metadata Next.js di src/app (favicon, icon, robots, sitemap, …)
 *  - semua file/folder top-level di public/ (nama tanpa ekstensi)
 * Hanya nama yang memang bisa menjadi slug (lolos SLUG_RE) yang diperiksa.
 */
import fs from "node:fs";
import path from "node:path";

import { RESERVED_SLUGS, SLUG_RE } from "../src/lib/invitations/reserved";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const APP = path.resolve(arg("app") ?? "src/app");
const PUBLIC = path.resolve(arg("public") ?? "public");

const METADATA_FILES = new Set([
  "favicon",
  "icon",
  "apple-icon",
  "opengraph-image",
  "twitter-image",
  "robots",
  "sitemap",
  "manifest",
]);

/** [nama rute, asal] dari src/app (route group ditembus). */
function appSegments(dir: string, rel = ""): [string, string][] {
  const out: [string, string][] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const where = path.join("src/app", rel, e.name);
    if (e.isDirectory()) {
      if (/^\(.+\)$/.test(e.name))
        out.push(...appSegments(path.join(dir, e.name), path.join(rel, e.name)));
      else if (/^[[_@]/.test(e.name)) continue;
      else out.push([e.name.toLowerCase(), where]);
    } else {
      const base = e.name.replace(/\.[^.]+$/, "").toLowerCase();
      if (METADATA_FILES.has(base)) out.push([base, where]);
    }
  }
  return out;
}

function publicEntries(dir: string): [string, string][] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map(
      (n) => [n.replace(/\.[^.]+$/, "").toLowerCase(), path.join("public", n)] as [string, string],
    );
}

const all = [...appSegments(APP), ...publicEntries(PUBLIC)];
const missing = all.filter(([name]) => SLUG_RE.test(name) && !RESERVED_SLUGS.has(name));

if (missing.length) {
  console.error("✗ Rute/file top-level belum ada di daftar slug terlarang:");
  for (const [name, where] of missing) console.error(`   - "${name}"  (${where})`);
  console.error(
    "\n  Undangan tampil di domain/{slug}; nama di atas bisa bentrok dengan undangan.\n" +
      "  Tambahkan ke RESERVED_SLUGS di src/lib/invitations/reserved.ts, lalu build ulang.\n" +
      "  Periksa juga apakah sudah ada undangan dengan slug itu di database.",
  );
  process.exit(1);
}
console.log(
  `✓ check:slugs — ${all.length} rute/file top-level, semua tercakup daftar slug terlarang`,
);
