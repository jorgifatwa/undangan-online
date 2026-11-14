/**
 * Pengaman script yang MEMBUAT/MENGHAPUS data uji (seed:perf, e2e:*).
 * Hanya boleh ke database lokal (localhost/127.0.0.1/::1). Database lain
 * (mis. staging) hanya bila ALLOW_SEED_PERF=1 diset secara sadar, dan TIDAK
 * PERNAH bila NODE_ENV=production. Lihat docs/DEPLOY.md.
 */
export function assertSafeDatabase(script: string) {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* URL tidak valid → dianggap tidak aman */
  }
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  const allowed = process.env.ALLOW_SEED_PERF === "1";
  // Host database production (dipisah koma) yang TIDAK PERNAH boleh disentuh,
  // bahkan dengan ALLOW_SEED_PERF=1. Isi di .env lokal setelah production ada.
  const protectedHosts = (process.env.PROTECTED_DB_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (host && protectedHosts.some((h) => host.toLowerCase().includes(h))) {
    console.error(
      `✗ ${script} DIBATALKAN: "${host}" terdaftar di PROTECTED_DB_HOSTS (production).`,
    );
    process.exit(2);
  }
  if (process.env.NODE_ENV === "production" || (!local && !allowed)) {
    console.error(
      `✗ ${script} DIBATALKAN: DATABASE_URL mengarah ke "${host || "?"}" ` +
        (process.env.NODE_ENV === "production"
          ? "dan NODE_ENV=production. Script ini tidak boleh dijalankan ke database production."
          : "(bukan lokal). Untuk database staging, jalankan dengan ALLOW_SEED_PERF=1 secara sadar."),
    );
    process.exit(2);
  }
}
