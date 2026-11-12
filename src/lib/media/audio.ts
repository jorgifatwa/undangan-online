import "server-only";

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { MAX_AUDIO_SECONDS } from "./limits";

const run = promisify(execFile);

/** Lokasi ffmpeg: ffmpeg-static (dibundel) atau FFMPEG_PATH. */
async function ffmpegPath(): Promise<string> {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const mod = (await import("ffmpeg-static")) as unknown as { default: string | null };
  if (!mod.default) throw new Error("ffmpeg tidak tersedia di server");
  return mod.default;
}

/**
 * Musik → AAC 96 kbps stereo .m4a (aturan musik di src/themes/README.md §9),
 * metadata dibuang, dipotong maksimal 15 menit, "faststart" agar bisa diputar
 * sebelum selesai diunduh. Mengembalikan file hasil + durasi (detik).
 */
export async function transcodeToAac(
  input: Buffer,
): Promise<{ data: Buffer; durationSec: number | null }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "undangku-audio-"));
  const src = path.join(dir, "in");
  const out = path.join(dir, "out.m4a");
  try {
    await fs.writeFile(src, input);
    const bin = await ffmpegPath();
    const { stderr } = await run(
      bin,
      [
        "-hide_banner",
        "-nostdin",
        "-y",
        "-i",
        src,
        "-vn",
        "-map_metadata",
        "-1",
        "-t",
        String(MAX_AUDIO_SECONDS),
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-ac",
        "2",
        "-ar",
        "44100",
        "-movflags",
        "+faststart",
        out,
      ],
      { timeout: 240_000, maxBuffer: 8 * 1024 * 1024 },
    );
    const m = /Duration: (\d+):(\d+):(\d+)/.exec(stderr);
    const total = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
    return {
      data: await fs.readFile(out),
      durationSec: total === null ? null : Math.min(total, MAX_AUDIO_SECONDS),
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
