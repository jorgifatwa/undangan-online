/**
 * Pengaman build production untuk aset berstatus `dev` di ASSET-AUDIT.md
 * (aset referensi yang BELUM dicek pemiliknya di Canva).
 *
 *   pnpm check:assets          (otomatis sebelum setiap `pnpm build`)
 *
 * Bila ada tema yang memakai aset `dev` (DEV_SLOTS di
 * src/themes/{tema}/assets/index.generated.ts), build DITOLAK — kecuali
 * ALLOW_DEV_ASSETS=1 diisi secara sadar (staging / pengukuran lokal), dari
 * environment atau file .env/.env.local. Dev server tidak terpengaruh.
 * Fail-closed: production yang lupa mengisi variabel apa pun otomatis tertahan.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const themesDir = path.join(ROOT, "src/themes");

function envFlag(name: string): string | undefined {
  if (process.env[name] !== undefined) return process.env[name];
  for (const f of [".env.local", ".env"]) {
    try {
      const m = fs
        .readFileSync(path.join(ROOT, f), "utf8")
        .match(new RegExp(`^\\s*${name}\\s*=\\s*"?([^"\\n#]*)"?`, "m"));
      if (m) return m[1].trim();
    } catch {
      /* file tidak ada */
    }
  }
  return undefined;
}

const found: { theme: string; slots: string[] }[] = [];
for (const theme of fs.readdirSync(themesDir)) {
  if (theme.startsWith("_")) continue;
  const file = path.join(themesDir, theme, "assets/index.generated.ts");
  if (!fs.existsSync(file)) continue;
  // tahan format (prettier bisa memecah array per baris + koma di akhir)
  const m = fs.readFileSync(file, "utf8").match(/DEV_SLOTS\s*=\s*\[([^\]]*)\]/);
  const slots = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  if (slots.length) found.push({ theme, slots });
}

if (!found.length) {
  console.log("✓ check:assets — tidak ada aset berstatus dev");
  process.exit(0);
}
const list = found.map((f) => `  - ${f.theme}: ${f.slots.join(", ")}`).join("\n");
if (envFlag("ALLOW_DEV_ASSETS") === "1") {
  console.warn(
    `⚠ check:assets — aset berstatus dev DIIZINKAN (ALLOW_DEV_ASSETS=1). JANGAN dipakai untuk production:\n${list}`,
  );
  process.exit(0);
}
console.error(
  `✗ check:assets — build DITOLAK: tema memakai aset berstatus "dev" (belum dicek pemilik di Canva):\n${list}\n` +
    `  Ubah status di src/themes/ASSET-AUDIT.md menjadi milik/free (atau pro → versi SVG) lalu jalankan pnpm assets:sync.\n` +
    `  Untuk staging/pengukuran lokal saja: ALLOW_DEV_ASSETS=1 pnpm build`,
);
process.exit(1);
