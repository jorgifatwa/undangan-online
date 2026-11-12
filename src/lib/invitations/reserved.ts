/**
 * Nama yang tidak boleh dipakai sebagai slug undangan karena dipakai sistem
 * (subdomain & rute). Tanpa dependensi server → aman untuk middleware Edge.
 */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "masuk",
  "daftar",
  "login",
  "tema",
  "u",
  "media",
  "static",
  "assets",
  "cdn",
  "mail",
  "email",
  "blog",
  "help",
  "bantuan",
  "support",
  "status",
  "preview",
  "pratinjau",
  "undangan",
  "billing",
  "bayar",
]);
