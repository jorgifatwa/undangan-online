import fs from "node:fs/promises";

import { localRoutesEnabled } from "@/lib/storage";
import { localPath } from "@/lib/storage/local";

/**
 * Penyaji file driver "local" (DEVELOPMENT). Mati di production atau bila
 * STORAGE_DRIVER=r2 (file disajikan langsung oleh R2/CDN). Hanya file final
 * (m/…) yang disajikan; file mentah (raw/…) tidak pernah publik.
 */
const TYPES: Record<string, string> = { webp: "image/webp", m4a: "audio/mp4" };

export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!localRoutesEnabled()) return new Response("Not found", { status: 404 });
  const { key } = await params;
  const k = key.join("/");
  const ext = k.split(".").pop() ?? "";
  if (!k.startsWith("m/") || !TYPES[ext]) return new Response("Not found", { status: 404 });
  let buf: Buffer;
  try {
    buf = await fs.readFile(localPath(k));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  // Range request (pemutar audio Safari)
  const range = req.headers.get("range");
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Math.min(Number(m[2]), buf.length - 1) : buf.length - 1;
    return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: {
        "Content-Type": TYPES[ext],
        "Content-Range": `bytes ${start}-${end}/${buf.length}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
      },
    });
  }
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": TYPES[ext],
      "Content-Length": String(buf.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
