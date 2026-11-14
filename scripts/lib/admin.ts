/**
 * Pengaman bersama skrip admin (grant-theme, suspend/unsuspend):
 *  - DITOLAK di production (NODE_ENV=production atau host database tercantum di
 *    PROTECTED_DB_HOSTS) kecuali variabel izin (mis. ALLOW_ADMIN_GRANT=1) diisi
 *    secara sadar.
 *  - identitas pelaku: --by + user OS (dicatat di AdminAudit).
 */
import os from "node:os";

export function cliArgs(argv = process.argv.slice(2)) {
  const opt = (k: string) => argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  const positional = argv.filter((a) => !a.startsWith("--"));
  return { opt, positional };
}

function dbHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "?";
  }
}

export function assertAdminAllowed(command: string, allowEnv: string) {
  const host = dbHost().toLowerCase();
  const protectedHosts = (process.env.PROTECTED_DB_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const production =
    process.env.NODE_ENV === "production" || protectedHosts.some((h) => host.includes(h));
  if (production && process.env[allowEnv] !== "1") {
    console.error(
      `✗ ${command} DIBATALKAN: database "${host}" adalah PRODUCTION. ` +
        `Jalankan dengan ${allowEnv}=1 bila memang disengaja (tetap tercatat di AdminAudit).`,
    );
    process.exit(2);
  }
  return { host, production };
}

export const adminActor = (by: string) => `${by} (os:${os.userInfo().username}@${os.hostname()})`;
