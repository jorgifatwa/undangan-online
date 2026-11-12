/**
 * Kompres semua musik tema ke AAC 96 kbps (.m4a).
 *
 *   pnpm music:optimize            → public/placeholders/music/*.{mp3,wav,aac,m4a}
 *   pnpm music:optimize <file...>  → file tertentu
 *
 * ATURAN: semua musik tema WAJIB melewati script ini (lihat src/themes/README.md).
 * 96 kbps AAC tetap jernih di speaker HP dan ±3× lebih kecil dari MP3 192–320 kbps.
 * Hasil: <nama>.m4a di folder yang sama; file sumber non-m4a dihapus setelah
 * konversi berhasil (kecuali --keep). File yang sudah ≤ 100 kbps dilewati.
 *
 * Memakai `ffmpeg` bila ada, selain itu `afconvert` (bawaan macOS).
 * (Kompresi otomatis untuk musik upload pengguna dibuat di tahap editor.)
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public/placeholders/music");
const BITRATE = 96_000;
const AUDIO = /\.(mp3|wav|aac|m4a|ogg|flac)$/i;

const has = (cmd: string) => spawnSync("which", [cmd]).status === 0;

/** Bitrate rata-rata (bit/s) dari ukuran & durasi. */
function bitrate(file: string): number | null {
  try {
    if (has("ffprobe")) {
      const out = execFileSync("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=bit_rate",
        "-of",
        "default=nw=1:nk=1",
        file,
      ])
        .toString()
        .trim();
      return Number(out) || null;
    }
    const info = execFileSync("afinfo", [file]).toString();
    const m = info.match(/bit rate: (\d+) bits per second/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

function convert(src: string, out: string) {
  if (has("ffmpeg")) {
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      src,
      "-vn",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      out,
    ]);
  } else if (has("afconvert")) {
    execFileSync("afconvert", [
      "-f",
      "m4af",
      "-d",
      "aac",
      "-b",
      String(BITRATE),
      "-s",
      "0",
      src,
      out,
    ]);
  } else {
    throw new Error("Butuh ffmpeg atau afconvert (macOS) untuk kompresi musik.");
  }
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const keep = process.argv.includes("--keep");
  const files = args.length
    ? args
    : fs
        .readdirSync(DIR)
        .filter((f) => AUDIO.test(f))
        .map((f) => path.join(DIR, f));
  for (const src of files) {
    const out = src.replace(AUDIO, ".m4a");
    const br = bitrate(src);
    if (/\.m4a$/i.test(src) && br !== null && br <= 100_000) {
      console.log(`· ${path.basename(src)} sudah ${Math.round(br / 1000)} kbps — dilewati`);
      continue;
    }
    const tmp = out === src ? `${out}.tmp.m4a` : out;
    convert(src, tmp);
    if (tmp !== out) fs.renameSync(tmp, out);
    const before = fs.statSync(src === out ? out : src).size;
    const after = fs.statSync(out).size;
    console.log(
      `✓ ${path.basename(src)} → ${path.basename(out)}: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB (${Math.round((bitrate(out) ?? 0) / 1000)} kbps)`,
    );
    if (!keep && src !== out) fs.rmSync(src);
  }
}

main();
