import type { EventType } from "@prisma/client";
import type { z } from "zod";

import { INSTAGRAM_RE, isTrustedUrl, normalizeInstagram, type LinkKind } from "@/lib/links";

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

/**
 * Buang link yang tidak lolos aturan domain tepercaya dari data LAMA (sebelum
 * aturan berlaku) agar undangan tetap tampil — linknya saja yang hilang.
 */
function dropUntrustedLinks(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const d = structuredClone(json) as Record<string, unknown>;
  const ok = (v: unknown, kind: LinkKind) => typeof v === "string" && isTrustedUrl(v, kind);
  if (Array.isArray(d.events))
    for (const e of d.events as Record<string, unknown>[])
      if (e && e.mapsUrl !== undefined && !ok(e.mapsUrl, "maps")) delete e.mapsUrl;
  const ls = d.liveStream as Record<string, unknown> | undefined;
  if (ls && !ok(ls.url, "liveStream")) delete d.liveStream;
  for (const key of ["bride", "groom"]) {
    const p = d[key] as Record<string, unknown> | undefined;
    if (p && typeof p.instagram === "string" && !INSTAGRAM_RE.test(normalizeInstagram(p.instagram)))
      delete p.instagram;
  }
  const gift = d.gift as Record<string, unknown> | undefined;
  for (const list of [d.wishlist, gift?.wishlist])
    if (Array.isArray(list))
      for (const w of list as Record<string, unknown>[])
        if (w && w.url !== undefined && !ok(w.url, "wishlist")) delete w.url;
  return d;
}

/**
 * Validasi kolom Invitation.data sesuai eventType. Bila gagal HANYA karena link
 * tak tepercaya (data lama), link dibuang lalu divalidasi ulang. Penyimpanan di
 * editor tetap memakai schema ketat (link ditolak dengan pesan jelas).
 */
export function parseInvitationData(
  eventType: EventType | string,
  json: unknown,
  /** strict: tanpa membuang link (dipakai saat MENYIMPAN dari editor). */
  opts: { strict?: boolean } = {},
): ParseResult {
  if (!isSupportedEventType(eventType)) {
    return { ok: false, error: new Error(`Jenis acara ${eventType} belum didukung`) };
  }
  const schema = eventType === "WEDDING" ? weddingDataSchema : birthdayDataSchema;
  let r = schema.safeParse(json);
  if (!r.success && !opts.strict) {
    const retry = schema.safeParse(dropUntrustedLinks(json));
    if (retry.success) r = retry;
  }
  return r.success
    ? { ok: true, value: { eventType, data: r.data } as AnyInvitationData }
    : { ok: false, error: r.error };
}
