import "server-only";
import { z } from "zod";

/**
 * Validasi environment variable sisi server.
 * Aplikasi gagal start dengan pesan jelas jika ada variabel wajib yang kosong,
 * daripada error misterius saat runtime.
 *
 * Variabel R2 & Midtrans ditambahkan di tahapnya masing-masing.
 */
const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
    AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID wajib diisi"),
    AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET wajib diisi"),

    // --- Penyimpanan file (foto & musik) ---
    /** "local" = folder .uploads/ (development); "r2" = Cloudflare R2 (production). */
    STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    /** URL publik bucket (custom domain / r2.dev), tanpa garis miring di akhir. */
    R2_PUBLIC_URL: z.url().optional(),
    /** Rahasia untuk memanggil /api/cron/media-cleanup (header Authorization: Bearer …). */
    CRON_SECRET: z.string().min(16).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.STORAGE_DRIVER === "r2") {
      for (const k of [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_PUBLIC_URL",
      ] as const)
        if (!v[k])
          ctx.addIssue({
            code: "custom",
            path: [k],
            message: `${k} wajib diisi bila STORAGE_DRIVER=r2`,
          });
    }
    if (
      v.STORAGE_DRIVER === "local" &&
      v.NODE_ENV === "production" &&
      !process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION
    ) {
      // Build/uji lokal memakai NODE_ENV=production; route /media & /api/upload tetap MATI di production.
      console.warn("[env] STORAGE_DRIVER=local di production: upload dinonaktifkan. Pakai r2.");
    }
  });

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Environment variable tidak valid:\n${issues}\nLihat .env.example.`);
}

export const env = parsed.data;
