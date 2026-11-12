import type { EventType } from "@prisma/client";
import type { z } from "zod";

import { birthdayDataSchema } from "./birthday";
import { configureZodIndonesian } from "./errors";
import type { AnyInvitationData } from "./sections";
import { weddingDataSchema } from "./wedding";

configureZodIndonesian();

export * from "./common";
export * from "./wedding";
export * from "./birthday";
export * from "./sections";

/** Schema per jenis acara. Jenis acara lain (aqiqah, dll.) ditambahkan di sini nanti. */
export const INVITATION_SCHEMAS = {
  WEDDING: weddingDataSchema,
  BIRTHDAY: birthdayDataSchema,
} as const;

export type SupportedEventType = keyof typeof INVITATION_SCHEMAS;

export function isSupportedEventType(t: EventType | string): t is SupportedEventType {
  return t in INVITATION_SCHEMAS;
}

export type ParseResult =
  { ok: true; value: AnyInvitationData } | { ok: false; error: z.ZodError | Error };

/** Validasi kolom Invitation.data sesuai eventType. */
export function parseInvitationData(eventType: EventType | string, json: unknown): ParseResult {
  if (!isSupportedEventType(eventType)) {
    return { ok: false, error: new Error(`Jenis acara ${eventType} belum didukung`) };
  }
  if (eventType === "WEDDING") {
    const r = weddingDataSchema.safeParse(json);
    return r.success
      ? { ok: true, value: { eventType, data: r.data } }
      : { ok: false, error: r.error };
  }
  const r = birthdayDataSchema.safeParse(json);
  return r.success
    ? { ok: true, value: { eventType, data: r.data } }
    : { ok: false, error: r.error };
}
