/**
 * Theme registry generator.
 *
 * Next.js tidak bisa memindai folder saat runtime di browser, jadi daftar tema
 * dibuat saat build/dev: script ini membaca setiap src/themes/{slug}/manifest.ts
 * (folder berawalan "_" dilewati) lalu menulis:
 *   - src/themes/registry.generated.ts      → daftar manifest (ringan, untuk listing)
 *   - src/themes/components.generated.tsx   → komponen tema via next/dynamic (lazy)
 *
 * Dijalankan otomatis oleh predev / prebuild / theme:new. Manual: pnpm themes:sync
 */
import fs from "node:fs";
import path from "node:path";

const THEMES_DIR = path.join(process.cwd(), "src/themes");
const HEADER = "// FILE DIBUAT OTOMATIS oleh scripts/themes-sync.ts — jangan diedit manual.\n";

const slugs = fs
  .readdirSync(THEMES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((slug) => fs.existsSync(path.join(THEMES_DIR, slug, "manifest.ts")))
  .sort();

const errors: string[] = [];
for (const slug of slugs) {
  const src = fs.readFileSync(path.join(THEMES_DIR, slug, "manifest.ts"), "utf8");
  const id = src.match(/\bid:\s*["']([^"']+)["']/)?.[1];
  if (id !== slug)
    errors.push(`- ${slug}/manifest.ts: id "${id}" harus sama dengan nama folder "${slug}"`);
  if (!fs.existsSync(path.join(THEMES_DIR, slug, "index.tsx")))
    errors.push(`- ${slug}/index.tsx tidak ada`);
}
if (errors.length) {
  console.error(`themes:sync gagal:\n${errors.join("\n")}`);
  process.exit(1);
}

const ident = (slug: string) => slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const registry = `${HEADER}import type { ThemeManifest } from "./types";
${slugs.map((s) => `import { manifest as ${ident(s)} } from "./${s}/manifest";`).join("\n")}

export const THEME_MANIFESTS: readonly ThemeManifest[] = [${slugs.map(ident).join(", ")}];

export type ThemeId = ${slugs.map((s) => `"${s}"`).join(" | ") || "never"};
`;

const components = `${HEADER}import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { ThemeProps } from "./types";

/** Komponen tema dimuat lazy: JS, CSS, dan font tema lain tidak ikut terunduh. */
export const THEME_COMPONENTS: Record<string, ComponentType<ThemeProps>> = {
${slugs.map((s) => `  "${s}": dynamic(() => import("./${s}")),`).join("\n")}
};
`;

const write = (file: string, content: string) => {
  const target = path.join(THEMES_DIR, file);
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === content) return;
  fs.writeFileSync(target, content);
};
write("registry.generated.ts", registry);
write("components.generated.tsx", components);
console.log(`themes:sync → ${slugs.length} tema: ${slugs.join(", ")}`);
