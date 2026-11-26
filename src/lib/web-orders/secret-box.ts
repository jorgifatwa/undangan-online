import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Enkripsi kecil (AES-256-GCM) untuk menyimpan token link khusus pesanan
 * website agar halaman hasil bisa menampilkannya. Kunci diturunkan dari
 * AUTH_SECRET; format: base64url(iv | tag | ciphertext).
 */
const key = () =>
  createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? ""}:web-order-claim-token`)
    .digest();

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

export function open(sealed: string): string | null {
  try {
    const buf = Buffer.from(sealed, "base64url");
    const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
