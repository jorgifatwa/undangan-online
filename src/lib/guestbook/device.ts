/**
 * Penanda perangkat tamu untuk rate limit buku tamu.
 *
 * Cookie acak (httpOnly, 128 bit, TANPA data pribadi) dibuat middleware saat
 * tamu pertama kali membuka undangan. Batas ketat kiriman berlaku per
 * perangkat, bukan per IP — di Indonesia ribuan pengguna seluler bisa berbagi
 * satu IP (CGNAT) dan tamu di hari H memakai Wi-Fi gedung yang sama.
 *
 * Aman untuk Edge runtime (dipakai di middleware).
 */
export const DEVICE_COOKIE = "udk_dev";
const DEVICE_RE = /^[a-f0-9]{32}$/;

export const deviceCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: 400 * 86400, // batas maksimum umur cookie di Chrome
});

export function newDeviceId() {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Nilai cookie yang valid, atau null (tidak ada / dipalsukan dengan format lain). */
export function parseDeviceId(v: string | undefined | null) {
  return v && DEVICE_RE.test(v) ? v : null;
}

export function deviceFromCookieHeader(header: string | null) {
  const m = header?.match(new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([^;]+)`));
  return parseDeviceId(m?.[1]);
}
