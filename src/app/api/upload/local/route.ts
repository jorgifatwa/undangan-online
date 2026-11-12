import fs from "node:fs/promises";
import path from "node:path";

import { localRoutesEnabled } from "@/lib/storage";
import { localPath, verifyUpload } from "@/lib/storage/local";

/**
 * Penerima upload driver "local" (DEVELOPMENT) — pengganti presigned PUT R2.
 * Mati di production / STORAGE_DRIVER=r2. URL ditandatangani (HMAC, 15 menit)
 * oleh requestUpload; hanya key raw/… dan ukuran dibatasi saat dibaca.
 */
export async function PUT(req: Request) {
  if (!localRoutesEnabled()) return new Response("Not found", { status: 404 });
  const u = new URL(req.url);
  const key = u.searchParams.get("key") ?? "";
  const max = Number(u.searchParams.get("max"));
  const exp = Number(u.searchParams.get("exp"));
  const sig = u.searchParams.get("sig") ?? "";
  if (!key.startsWith("raw/") || !verifyUpload(key, max, exp, sig))
    return new Response("Tanda tangan upload tidak valid", { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > max)
    return new Response("File terlalu besar", { status: 413 });

  // Baca bertahap; hentikan bila melebihi batas (Content-Length bisa dipalsukan).
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = req.body?.getReader();
  if (!reader) return new Response("Body kosong", { status: 400 });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      return new Response("File terlalu besar", { status: 413 });
    }
    chunks.push(value);
  }
  const file = localPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.concat(chunks));
  return new Response(null, { status: 200 });
}
