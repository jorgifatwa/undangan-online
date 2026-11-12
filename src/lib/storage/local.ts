import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { StorageDriver, StoredObject } from "./types";

/**
 * Driver "local" (DEVELOPMENT): file di folder .uploads/ (gitignored),
 * disajikan oleh /media/[...key] dan diunggah lewat /api/upload/local.
 * Kedua route itu menolak semua request di production.
 */
export const LOCAL_ROOT = path.join(process.cwd(), ".uploads");

export function localPath(key: string): string {
  const full = path.resolve(LOCAL_ROOT, key);
  // cegah path traversal ("../")
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error("Key tidak valid");
  return full;
}

/** Token upload: HMAC(key|maxBytes|exp) dengan AUTH_SECRET, berlaku 15 menit. */
export function signUpload(key: string, maxBytes: number, exp: number): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`upload|${key}|${maxBytes}|${exp}`)
    .digest("base64url");
}
export function verifyUpload(key: string, maxBytes: number, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const a = Buffer.from(signUpload(key, maxBytes, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function walk(dir: string, base: string): Promise<StoredObject[]> {
  let entries: import("node:fs").Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: StoredObject[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, base)));
    else {
      const st = await fs.stat(full);
      out.push({
        key: path.relative(base, full).split(path.sep).join("/"),
        size: st.size,
        lastModified: st.mtime,
      });
    }
  }
  return out;
}

export const localDriver: StorageDriver = {
  name: "local",
  async createUploadTarget(key, contentType, maxBytes) {
    const exp = Date.now() + 15 * 60_000;
    const q = new URLSearchParams({
      key,
      max: String(maxBytes),
      exp: String(exp),
      sig: signUpload(key, maxBytes, exp),
    });
    return {
      url: `/api/upload/local?${q}`,
      method: "PUT",
      headers: { "Content-Type": contentType },
    };
  },
  async put(key, body) {
    const file = localPath(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
  },
  async get(key) {
    try {
      return await fs.readFile(localPath(key));
    } catch {
      return null;
    }
  },
  async size(key) {
    try {
      return (await fs.stat(localPath(key))).size;
    } catch {
      return null;
    }
  },
  async delete(key) {
    await fs.rm(localPath(key), { force: true });
  },
  publicUrl(key) {
    return `/media/${key}`;
  },
  keyFromUrl(url) {
    return url.startsWith("/media/") ? url.slice("/media/".length) : null;
  },
  async list(prefix) {
    return (await walk(LOCAL_ROOT, LOCAL_ROOT)).filter((o) => o.key.startsWith(prefix));
  },
};
