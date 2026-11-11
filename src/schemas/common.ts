import { z } from "zod";

/**
 * Blok data yang dipakai bersama semua jenis acara.
 *
 * Prinsip: hanya NAMA dan TANGGAL ACARA yang wajib. Semua field lain opsional
 * supaya undangan tetap tampil rapi saat data belum lengkap; section yang
 * datanya kosong otomatis disembunyikan (lihat isSectionEmpty di sections.ts).
 */

/** String opsional: string kosong / spasi dianggap tidak diisi. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const TIMEZONE_VALUES = ["WIB", "WITA", "WIT"] as const;
export const timezoneSchema = z.enum(TIMEZONE_VALUES);

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD");
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:mm");

export const photoSchema = z.object({
  url: z.string().min(1),
  alt: optionalText(200),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Titik fokus (0–100%) untuk object-position saat foto dipotong bingkai. */
  focusX: z.number().min(0).max(100).optional(),
  focusY: z.number().min(0).max(100).optional(),
});
export type Photo = z.infer<typeof photoSchema>;

export const parentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  /** true → ditampilkan dengan awalan Alm. (ayah) / Almh. (ibu). */
  deceased: z.boolean().optional(),
});
export type Parent = z.infer<typeof parentSchema>;

export const eventSchema = z.object({
  /** Id stabil, dirujuk oleh Guest.allowedEventIds. */
  id: z.string().min(1).max(40),
  /** Nama acara bebas: "Akad Nikah", "Resepsi", "Pesta Ulang Tahun". */
  name: z.string().trim().min(1).max(60),
  date: dateString,
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  /** true → jam selesai ditulis "selesai". */
  untilFinished: z.boolean().optional(),
  timezone: timezoneSchema.default("WIB"),
  venueName: optionalText(120),
  address: optionalText(400),
  mapsUrl: z.url().optional(),
});
export type InvitationEvent = z.infer<typeof eventSchema>;

export const quoteSchema = z.object({
  arabic: optionalText(2000),
  translation: optionalText(1500),
  source: optionalText(120),
});
export type Quote = z.infer<typeof quoteSchema>;

export const greetingSchema = z.object({
  /** "islami" → Assalamu'alaikum / Wassalamu'alaikum + Basmalah. */
  style: z.enum(["islami", "umum"]).default("umum"),
  openingText: optionalText(800),
  closingText: optionalText(800),
});
export type Greeting = z.infer<typeof greetingSchema>;

export const musicTrackSchema = z.object({
  url: z.string().min(1),
  title: optionalText(120),
  artist: optionalText(120),
});
export const musicSchema = z.object({
  tracks: z.array(musicTrackSchema).max(10).default([]),
  /** Diputar otomatis setelah tamu menekan "Buka Undangan". */
  autoplay: z.boolean().default(true),
});
export type MusicTrack = z.infer<typeof musicTrackSchema>;

export const bankAccountSchema = z.object({
  bank: z.string().trim().min(1).max(60),
  number: z.string().trim().min(1).max(40),
  holder: z.string().trim().min(1).max(120),
});
export type BankAccount = z.infer<typeof bankAccountSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(20),
});

export const giftSchema = z.object({
  intro: optionalText(600),
  accounts: z.array(bankAccountSchema).max(6).default([]),
  qris: photoSchema.optional(),
  /** Kado fisik: alamat pengiriman. */
  physical: z
    .object({
      recipient: optionalText(120),
      address: z.string().trim().min(1).max(400),
      phone: optionalText(20),
    })
    .optional(),
  /** Nomor yang bisa dihubungi untuk konfirmasi kiriman hadiah. */
  confirmContacts: z.array(contactSchema).max(4).default([]),
});
export type Gift = z.infer<typeof giftSchema>;

export const dressCodeSchema = z.object({
  text: optionalText(300),
  colors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna hex #RRGGBB"))
    .max(8)
    .default([]),
});
export type DressCode = z.infer<typeof dressCodeSchema>;

export const liveStreamSchema = z.object({
  url: z.url(),
  platform: optionalText(40),
  note: optionalText(200),
});

export const sectionConfigSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean().default(true),
});
export type SectionConfig = z.infer<typeof sectionConfigSchema>;

/** Field yang ada di semua jenis acara. */
export const baseInvitationShape = {
  /** Minimal satu acara (tanggal wajib). */
  events: z.array(eventSchema).min(1, "Minimal satu acara"),
  greeting: greetingSchema.optional(),
  quote: quoteSchema.optional(),
  gallery: z.array(photoSchema).max(60).default([]),
  music: musicSchema.optional(),
  gift: giftSchema.optional(),
  dressCode: dressCodeSchema.optional(),
  liveStream: liveStreamSchema.optional(),
  /** Urutan & visibilitas section; kosong = urutan default tema. */
  sections: z.array(sectionConfigSchema).default([]),
};
