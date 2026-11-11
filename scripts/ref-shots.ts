/**
 * Screenshot referensi per section dari versi LIVE (untuk /preview/banding).
 *
 *   pnpm ref:shots
 *
 * Hasil (gitignored):
 *   .reference/shots/{tema}/NN-{section}.webp   (lebar 430 px CSS)
 *   public/_ref/shots/...                         (salinan untuk ditampilkan)
 *   .reference/shots.json                         (daftar + label section)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { launchBrowser } from "./lib/browser";
import { JORGI_SECTION_LABELS, OUT_DIR, PUBLIC_REF_DIR, REFERENCES } from "./lib/reference";
import { collectSections, contentHeight, openTall, REF_WIDTH } from "./lib/reference-page";

interface Shot {
  theme: string;
  index: number;
  key: string;
  label: string;
  file: string;
  width: number;
  height: number;
}

async function main() {
  const browser = await launchBrowser();
  const shots: Shot[] = [];
  try {
    for (const ref of REFERENCES) {
      const outDir = path.join(OUT_DIR, "shots", ref.theme);
      const pubDir = path.join(PUBLIC_REF_DIR, "shots", ref.theme);
      await fs.mkdir(outDir, { recursive: true });
      await fs.mkdir(pubDir, { recursive: true });

      const save = async (png: Uint8Array, index: number, key: string, label: string) => {
        const name = `${String(index).padStart(2, "0")}-${key.replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "s"}.webp`;
        const img = sharp(png).webp({ quality: 82 });
        const meta = await sharp(png).metadata();
        await img.toFile(path.join(outDir, name));
        await fs.copyFile(path.join(outDir, name), path.join(pubDir, name));
        shots.push({
          theme: ref.theme,
          index,
          key,
          label,
          file: `/_ref/shots/${ref.theme}/${name}`,
          width: meta.width ?? REF_WIDTH,
          height: meta.height ?? 0,
        });
        console.log(`  ✓ ${ref.theme} ${name} — ${label}`);
      };

      // Cover (sebelum dibuka), ukuran layar HP.
      const cover = await openTall(browser, `${ref.liveUrl}${ref.coverPath}`, 860, 4000);
      await save(
        await cover.screenshot(),
        0,
        "cover",
        ref.theme === "tirai-beludru" ? JORGI_SECTION_LABELS.cover : "Cover",
      );
      await cover.close();

      // Isi undangan: viewport setinggi konten, lalu potong per section.
      const probe = await openTall(browser, `${ref.liveUrl}${ref.detailsPath}`, 900, 2500);
      const h = Math.min(16000, (await contentHeight(probe)) + 200);
      await probe.close();
      const page = await openTall(browser, `${ref.liveUrl}${ref.detailsPath}`, h, 7000);
      const sections = await collectSections(page, "details");
      let i = 1;
      for (const s of sections) {
        if (s.height < 80) continue;
        const png = await page.screenshot({
          clip: { x: 0, y: s.top, width: REF_WIDTH, height: s.height },
          captureBeyondViewport: true,
        });
        await save(png, i++, s.key, JORGI_SECTION_LABELS[s.label] ?? s.label);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  await fs.writeFile(
    path.join(OUT_DIR, "shots.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), shots }, null, 2),
  );
  console.log(`✓ ${shots.length} screenshot → .reference/shots.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
