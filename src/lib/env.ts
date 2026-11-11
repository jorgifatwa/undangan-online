import "server-only";
import { z } from "zod";

/**
 * Validasi environment variable sisi server.
 * Aplikasi gagal start dengan pesan jelas jika ada variabel wajib yang kosong,
 * daripada error misterius saat runtime.
 *
 * Variabel R2 & Midtrans ditambahkan di tahapnya masing-masing.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID wajib diisi"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET wajib diisi"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Environment variable tidak valid:\n${issues}\nLihat .env.example.`);
}

export const env = parsed.data;
