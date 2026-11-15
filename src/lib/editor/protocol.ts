import { z } from "zod";

import { SECTION_IDS } from "@/schemas/sections";

/**
 * Protokol postMessage editor ↔ iframe pratinjau (satu origin).
 * Kedua sisi WAJIB: cek event.origin === location.origin, cek sumber pesan
 * (iframe hanya menerima dari window.parent; editor hanya dari iframe-nya),
 * lalu validasi bentuk pesan dengan schema di bawah. Data undangan di dalam
 * pesan "update" divalidasi lagi dengan schema undangan sebelum dirender.
 */
const ns = z.literal("undangku");

export const toPreviewSchema = z.discriminatedUnion("type", [
  z.object({
    ns,
    type: z.literal("update"),
    themeId: z.string().min(1).max(60),
    variantId: z.string().max(60).nullable(),
    data: z.unknown(),
  }),
  /**
   * Gulir pratinjau ke section. `order` = urutan section tema: bila section
   * belum dirender (datanya kosong), gulir ke section terdekat sebelumnya/
   * sesudahnya. "cover" = puncak halaman.
   */
  z.object({
    ns,
    type: z.literal("focus"),
    section: z.enum(SECTION_IDS),
    order: z.array(z.enum(SECTION_IDS)).max(40).optional(),
  }),
  z.object({ ns, type: z.literal("cover"), show: z.boolean() }),
  /** Demo landing page: ganti nama di data contoh (lihat preview/[themeId]/DemoPreview). */
  z.object({
    ns,
    type: z.literal("names"),
    primary: z.string().max(40),
    secondary: z.string().max(40),
  }),
]);
export type ToPreview = z.infer<typeof toPreviewSchema>;

export const fromPreviewSchema = z.discriminatedUnion("type", [
  z.object({ ns, type: z.literal("ready") }),
  /** Topi pesta digeser di pratinjau (persen relatif foto; lihat schemas/birthday hatSchema). */
  z.object({
    ns,
    type: z.literal("hat"),
    section: z.enum(["cover", "hero"]),
    pos: z.object({
      x: z.number().min(-60).max(160),
      y: z.number().min(-60).max(160),
      w: z.number().min(2).max(150),
      r: z.number().min(-180).max(180),
      for: z.string().max(600),
    }),
  }),
]);
export type FromPreview = z.infer<typeof fromPreviewSchema>;

/** Batas ukuran pesan (JSON) — data undangan wajar jauh di bawah ini. */
export const MAX_MESSAGE_CHARS = 400_000;

export function parseMessage<T>(
  schema: z.ZodType<T>,
  event: MessageEvent,
  expectedSource: MessageEventSource | null,
): T | null {
  if (event.origin !== window.location.origin) return null;
  if (!expectedSource || event.source !== expectedSource) return null;
  try {
    if (JSON.stringify(event.data).length > MAX_MESSAGE_CHARS) return null;
  } catch {
    return null;
  }
  const r = schema.safeParse(event.data);
  return r.success ? r.data : null;
}
