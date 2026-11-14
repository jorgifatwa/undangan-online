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
  z.object({ ns, type: z.literal("focus"), section: z.enum(SECTION_IDS) }),
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

export const fromPreviewSchema = z.object({ ns, type: z.literal("ready") });
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
