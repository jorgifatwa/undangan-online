import { z } from "zod";

import { getQuotePreset } from "@/lib/quotes";
import {
  birthdayDataSchema,
  dateString,
  timezoneSchema,
  weddingDataSchema,
  type AnyInvitationData,
} from "@/schemas";

/**
 * Data awal undangan dari wizard (TANPA data contoh): hanya yang diisi user,
 * plus kutipan siap pakai yang DIPILIH user di wizard (src/lib/quotes.ts;
 * bisa diubah/dihapus di editor). Dipakai server
 * action pembuatan undangan & preview ?minimal=1 (cek tampilan data minim).
 */

const realDate = z
  .string("Tanggal acara wajib diisi")
  .min(1, "Tanggal acara wajib diisi")
  .pipe(dateString)
  .refine((d) => {
    const t = new Date(`${d}T12:00:00Z`);
    return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
  }, "Tanggal tidak valid");
const name = (label: string) =>
  z.string().trim().min(1, `${label} wajib diisi`).max(120, "Maksimal 120 karakter");
const nick = z
  .string()
  .trim()
  .max(40, "Maksimal 40 karakter")
  .optional()
  .transform((v) => v || undefined);
const city = z.string().trim().min(1, "Kota wajib diisi").max(80, "Maksimal 80 karakter");
const themeId = z.string().min(1, "Pilih tema").max(60);
/** Id kutipan siap pakai (src/lib/quotes.ts) atau "" = tanpa kutipan. */
const quoteId = z
  .string()
  .max(60)
  .optional()
  .refine((v) => !v || !!getQuotePreset(v), "Kutipan tidak dikenal");

export const wizardSchema = z.discriminatedUnion("eventType", [
  z.object({
    eventType: z.literal("WEDDING"),
    brideName: name("Nama mempelai wanita"),
    brideNickname: nick,
    groomName: name("Nama mempelai pria"),
    groomNickname: nick,
    date: realDate,
    timezone: timezoneSchema,
    city,
    greeting: z.enum(["islami", "umum"]),
    quoteId,
    themeId,
  }),
  z.object({
    eventType: z.literal("BIRTHDAY"),
    name: name("Nama yang berulang tahun"),
    nickname: nick,
    age: z.coerce
      .number<string | number>()
      .int("Usia harus bilangan bulat")
      .min(1, "Usia minimal 1")
      .max(120, "Usia maksimal 120")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    date: realDate,
    timezone: timezoneSchema,
    city,
    quoteId,
    themeId,
  }),
]);
export type WizardInput = z.input<typeof wizardSchema>;
export type WizardValues = z.output<typeof wizardSchema>;

/** Teks dasar untuk slug: nama panggilan (atau kata pertama nama lengkap). */
export function slugBase(v: WizardValues): string {
  const first = (s: string) => s.trim().split(/\s+/)[0];
  return v.eventType === "WEDDING"
    ? `${v.brideNickname ?? first(v.brideName)} ${v.groomNickname ?? first(v.groomName)}`
    : `${v.nickname ?? first(v.name)} ulang tahun`;
}

function presetQuote(id: string | undefined) {
  const p = id ? getQuotePreset(id) : undefined;
  return p ? { arabic: p.arabic, translation: p.translation, source: p.source } : undefined;
}

export function buildInitialData(v: WizardValues): AnyInvitationData {
  if (v.eventType === "WEDDING") {
    return {
      eventType: "WEDDING",
      data: weddingDataSchema.parse({
        bride: { fullName: v.brideName, nickname: v.brideNickname },
        groom: { fullName: v.groomName, nickname: v.groomNickname },
        order: "bride-first",
        events: [
          { id: "resepsi", name: "Resepsi", date: v.date, timezone: v.timezone, city: v.city },
        ],
        greeting: { style: v.greeting },
        quote: presetQuote(v.quoteId),
      }),
    };
  }
  return {
    eventType: "BIRTHDAY",
    data: birthdayDataSchema.parse({
      celebrant: { name: v.name, nickname: v.nickname, age: v.age },
      events: [
        {
          id: "pesta",
          name: "Pesta Ulang Tahun",
          date: v.date,
          timezone: v.timezone,
          city: v.city,
        },
      ],
      greeting: { style: "umum" },
      quote: presetQuote(v.quoteId),
    }),
  };
}
