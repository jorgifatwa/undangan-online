import "server-only";

import { randomBytes } from "node:crypto";

/** Kata sandi acak yang mudah diketik (tanpa huruf/angka yang mirip). */
export function newPassword(length = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return [...randomBytes(length)].map((b) => chars[b % chars.length]).join("");
}
