import { z } from "zod";

/**
 * Input buku tamu (RSVP + ucapan) — dipakai browser & server.
 * Satu kiriman bisa berisi kehadiran, ucapan, atau keduanya (tema yang
 * menggabungkan RSVP & ucapan dalam satu formulir).
 */
export const MAX_NAME = 80;
export const MAX_MESSAGE = 500;
export const MAX_PAX = 10;

/** Tautan / domain / pemendek link → ditolak di nama & ucapan (anti-spam). */
export const LINK_RE =
  /(https?:\/\/|www\.|wa\.me|t\.me|bit\.ly|s\.id\/|\b[a-z0-9-]{2,}\.(com|id|net|org|co|io|me|ly|xyz|info|biz|site|online|app|link|click|top|shop|store|live|club|vip)\b)/i;

export const guestbookInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama belum diisi.")
      .max(MAX_NAME, `Nama maksimal ${MAX_NAME} karakter.`),
    attendance: z.enum(["HADIR", "TIDAK_HADIR", "RAGU"]).optional(),
    pax: z.coerce.number().int().min(1).max(MAX_PAX).optional(),
    message: z
      .string()
      .trim()
      .max(MAX_MESSAGE, `Ucapan maksimal ${MAX_MESSAGE} karakter.`)
      .optional()
      .transform((v) => v || undefined),
    /** Honeypot: tidak terlihat manusia; bot cenderung mengisinya. */
    website: z.string().max(300).optional(),
    /** Waktu formulir mulai ditampilkan (ms epoch) — bot mengirim terlalu cepat. */
    startedAt: z.number().int(),
  })
  .refine((v) => v.attendance || v.message, {
    message: "Isi konfirmasi kehadiran atau ucapan.",
    path: ["message"],
  })
  .refine((v) => !LINK_RE.test(v.name) && !LINK_RE.test(v.message ?? ""), {
    message: "Ucapan tidak boleh berisi tautan/link.",
    path: ["message"],
  });
export type GuestbookInput = z.input<typeof guestbookInputSchema>;

export interface GuestbookStats {
  hadir: number;
  tidakHadir: number;
  ragu: number;
  /** Jumlah orang yang hadir (pax). */
  orang: number;
  ucapan: number;
}
