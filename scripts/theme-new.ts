/**
 * Buat kerangka tema baru yang langsung bisa dipreview.
 *
 *   pnpm theme:new nama-tema [--acara=wedding|ultah] [--nama="Nama Tampil"]
 *
 * Membuat src/themes/{nama-tema}/ berisi manifest, index, fonts, tokens,
 * theme.css, dan assets/index.generated.ts kosong, lalu menjalankan
 * themes:sync agar tema muncul di /tema dan /preview/{nama-tema}.
 * Semua section memakai section default _shared sampai tema meng-override-nya.
 * Langkah lanjut: lihat src/themes/README.md ("Membuat tema baru").
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const opt = (k: string) =>
  args
    .find((a) => a.startsWith(`--${k}=`))
    ?.split("=")
    .slice(1)
    .join("=");

if (!slug || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    'Pakai: pnpm theme:new nama-tema   (huruf kecil, angka, tanda "-"; mis. "melati-putih")',
  );
  process.exit(1);
}
const dir = path.join(process.cwd(), "src/themes", slug);
if (fs.existsSync(dir)) {
  console.error(`Folder src/themes/${slug} sudah ada.`);
  process.exit(1);
}

const birthday = opt("acara") === "ultah";
const name =
  opt("nama") ??
  slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
const ident = slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const Comp = ident[0].toUpperCase() + ident.slice(1);
const prefix = slug
  .split("-")
  .map((w) => w[0])
  .join("")
  .slice(0, 3);

const sections = birthday
  ? [
      "cover",
      "salam",
      "profil",
      "acara",
      "hitungMundur",
      "maps",
      "dressCode",
      "galeri",
      "rsvp",
      "ucapan",
      "amplop",
      "penutup",
    ]
  : [
      "cover",
      "ayat",
      "salam",
      "profil",
      "loveStory",
      "acara",
      "hitungMundur",
      "maps",
      "dressCode",
      "liveStream",
      "galeri",
      "rsvp",
      "ucapan",
      "amplop",
      "penutup",
    ];

const files: Record<string, string> = {
  "manifest.ts": `import type { ThemeManifest } from "../types";
import { VARIANTS } from "./tokens";

/**
 * ${name} — TODO: satu kalimat konsep desain.
 * Sumber desain & status aset: catat di src/themes/ASSET-AUDIT.md.
 */
export const manifest = {
  id: "${slug}",
  name: "${name}",
  description: "TODO: deskripsi singkat untuk galeri tema.",
  category: "${birthday ? "ceria" : "elegan"}",
  eventTypes: ["${birthday ? "BIRTHDAY" : "WEDDING"}"],
  minPackage: "BASIC",
  variants: VARIANTS,
  sections: ${JSON.stringify(sections, null, 4)
    .replace(/\n\]/, ",\n  ]")
    .replace(/\n {4}/g, "\n    ")},
  // Section yang wajib tepat setelah cover & tidak bisa dipindah/disembunyikan:
  // lockedSections: ["ayat"],
  thumbnail: {
    background: "linear-gradient(160deg, #3b4a3f 0%, #1c2620 100%)",
    foreground: "#f5efe6",
  },
  // Musik WAJIB lewat \`pnpm music:optimize\` (AAC 96 kbps, .m4a):
  // defaultMusic: { url: "/placeholders/music/${slug}.m4a", title: "", artist: "" },
} as const satisfies ThemeManifest;
`,
  "tokens.ts": `import type { ColorVariant } from "../types";

/**
 * Varian warna (2–4; yang pertama default). Section & ornamen hanya membaca
 * token --inv-* ini, jadi varian = ganti nilai token.
 */
export const VARIANTS: readonly ColorVariant[] = [
  {
    id: "utama",
    name: "Utama",
    swatch: ["#1c2620", "#b08d57", "#f5efe6"],
    tokens: {
      "--inv-bg": "#f5efe6",
      "--inv-bg-alt": "#ebe2d4",
      "--inv-surface": "#fffaf3",
      "--inv-surface-text": "#2a2420",
      "--inv-text": "#2a2420",
      "--inv-text-muted": "#6d6258",
      "--inv-primary": "#1c2620",
      "--inv-primary-text": "#f5efe6",
      "--inv-accent": "#b08d57",
      "--inv-accent-2": "#7a8f6b",
      "--inv-border": "rgb(0 0 0 / 0.1)",
      "--inv-backdrop": "#1c2620",
      "--inv-font-display": "var(--${prefix}-display), Georgia, serif",
      "--inv-font-body": "var(--${prefix}-body), Georgia, serif",
      "--inv-font-script": "var(--${prefix}-display), cursive",
      "--inv-font-arabic": "var(--${prefix}-arabic), serif",
    },
  },
];
`,
  "fonts.ts": `import localFont from "next/font/local";

/**
 * Font tema: HANYA font OFL, di-subset lewat \`pnpm fonts:build\`
 * (tambahkan keluarga baru di scripts/fonts-build.ts → src/themes/_fonts/).
 * Selalu display: "swap" + preload: false (semua tema berbagi satu rute).
 * Nama konstanta = nama font-family → harus unik antartema (berawalan nama tema).
 */
const ${ident}Display = localFont({
  src: "../_fonts/cormorant-400-700.woff2",
  weight: "400 700",
  variable: "--${prefix}-display",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const ${ident}Body = localFont({
  src: [
    { path: "../_fonts/lora-400-600.woff2", weight: "400 600", style: "normal" },
    { path: "../_fonts/lora-italic-400.woff2", weight: "400", style: "italic" },
  ],
  variable: "--${prefix}-body",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

const ${ident}Arabic = localFont({
  src: "../_fonts/amiri-arabic.woff2",
  weight: "400",
  variable: "--${prefix}-arabic",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

export const fontClassName = [${ident}Display, ${ident}Body, ${ident}Arabic].map((f) => f.variable).join(" ");
`,
  "theme.css": `/*
 * ${name} — gaya khusus tema. Selalu batasi selector dengan
 * [data-theme="${slug}"] dan hanya animasikan transform/opacity.
 */
[data-theme="${slug}"] {
}

/* Mode ringan & reduced motion: matikan animasi berulang yang mahal. */
[data-theme="${slug}"][data-lite] {
}
`,
  "index.tsx": `"use client";

import { ThemeRoot } from "../_shared/runtime/ThemeRoot";
import type { ThemeDefinition, ThemeProps } from "../types";
import { THEME_ASSETS } from "./assets/index.generated";
import { fontClassName } from "./fonts";
import { manifest } from "./manifest";
import "./theme.css";

/**
 * ${name}. Section yang tidak di-override memakai section default _shared
 * (diwarnai token varian). Override per section lewat \`sections\`, cover
 * lewat \`Cover\`, efek lewat \`Ambient\`.
 */
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS,
  sections: {},
};

export default function ${Comp}Theme(props: ThemeProps) {
  return <ThemeRoot theme={definition} {...props} />;
}
`,
  "assets/index.generated.ts": `// FILE DIBUAT OTOMATIS oleh scripts/assets-sync.ts dari ASSET-AUDIT.md — jangan diedit manual.
import type { ThemeAssets } from "../../_shared/assets";

/** Belum ada aset berstatus free/milik → tema memakai versi SVG. */
export const THEME_ASSETS: ThemeAssets = {};

export const GENERATED_FILES = [];
`,
};

for (const [file, content] of Object.entries(files)) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
execSync("pnpm -s exec prettier --write " + JSON.stringify(dir), { stdio: "ignore" });
execSync("pnpm -s themes:sync", { stdio: "inherit" });

console.log(`
✓ Tema "${name}" dibuat di src/themes/${slug}/
  Preview : /preview/${slug}
  Galeri  : /tema
Langkah berikutnya (detail di src/themes/README.md):
  1. Isi deskripsi, kategori, varian (tokens.ts), dan font (fonts.ts).
  2. Catat aset di ASSET-AUDIT.md → pnpm assets:sync.
  3. Override Cover/section seperlunya; musik lewat pnpm music:optimize.
  4. pnpm themes:thumbs (thumbnail /tema) dan pnpm perf (target LCP ≤ 2,5 s, ≥ 55 fps).`);
