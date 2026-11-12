import "server-only";

import type { RsvpStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { isActive } from "@/lib/invitations/publish";
import { getFeatures } from "@/lib/packages";

import { guestbookInputSchema, type GuestbookStats } from "./schema";

/**
 * Buku tamu publik (RSVP & ucapan) + moderasi pemilik.
 *
 * Anti-spam (berlapis, tanpa layanan tambahan — rate limit dihitung dari
 * baris di database sehingga tetap bekerja di serverless):
 *  1. honeypot terisi / dikirim < 3 dtk setelah form tampil → pura-pura sukses
 *  2. tautan di nama/ucapan ditolak; panjang dibatasi (schema)
 *  3. per PERANGKAT (cookie acak, lihat device.ts): maks 5 kiriman / undangan / 10 menit
 *     — tanpa cookie: semua kiriman tanpa cookie dari IP yang sama berbagi batas ini
 *  4. per IP: dilonggarkan jauh (CGNAT seluler & Wi-Fi gedung membuat banyak tamu
 *     sungguhan berbagi IP) — hanya menahan serangan massal:
 *     100 / undangan / 10 menit, 300 lintas undangan / 10 menit
 *  5. per undangan (banjir dari banyak IP): 120 / menit; Premium ke atas 300 / menit
 *  6. ucapan sama persis dari perangkat/IP yang sama dalam 1 jam → tidak digandakan
 */
const MIN_FILL_MS = 3000;
const MAX_FORM_AGE_MS = 7 * 86400_000;
export const LIMITS = {
  perDevice: 5,
  perIpInvitation: 100,
  perIpGlobal: 300,
  perInvitationMinute: { FREE: 120, BASIC: 120, PREMIUM: 300, EXCLUSIVE: 300 },
} as const;
export const RATE_LIMIT_MESSAGE =
  "Terlalu banyak ucapan dalam waktu singkat, coba lagi sebentar lagi.";

export interface Requester {
  ipHash: string;
  /** null = tanpa cookie perangkat (cookie diblokir / bot). */
  deviceId: string | null;
}

export interface PublicWish {
  id: string;
  name: string;
  message: string;
  attendance?: RsvpStatus;
  createdAt: string;
}

export type SubmitResult =
  | { ok: true; wish?: PublicWish; stats: GuestbookStats }
  | { ok: false; status: number; error: string; rateLimited?: boolean };

async function activeInvitation(slug: string) {
  const inv = await db.invitation.findUnique({
    where: { slug },
    select: { id: true, status: true, expiresAt: true, package: true },
  });
  return inv && isActive(inv) ? inv : null;
}

export async function guestbookStats(invitationId: string): Promise<GuestbookStats> {
  const [groups, ucapan] = await Promise.all([
    db.rsvp.groupBy({
      by: ["status"],
      where: { invitationId },
      _count: { _all: true },
      _sum: { pax: true },
    }),
    db.wish.count({ where: { invitationId, isHidden: false } }),
  ]);
  const get = (s: RsvpStatus) => groups.find((g) => g.status === s);
  return {
    hadir: get("HADIR")?._count._all ?? 0,
    tidakHadir: get("TIDAK_HADIR")?._count._all ?? 0,
    ragu: get("RAGU")?._count._all ?? 0,
    orang: get("HADIR")?._sum.pax ?? 0,
    ucapan,
  };
}

const toPublic = (w: {
  id: string;
  name: string;
  message: string;
  attendance: RsvpStatus | null;
  createdAt: Date;
}): PublicWish => ({
  id: w.id,
  name: w.name,
  message: w.message,
  attendance: w.attendance ?? undefined,
  createdAt: w.createdAt.toISOString(),
});

export async function submitGuestbook(
  slug: string,
  raw: unknown,
  { ipHash, deviceId }: Requester,
  now = new Date(),
): Promise<SubmitResult> {
  const inv = await activeInvitation(slug);
  if (!inv)
    return { ok: false, status: 404, error: "Undangan tidak ditemukan atau sudah tidak aktif." };

  const parsed = guestbookInputSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      status: 400,
      error: parsed.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  const input = parsed.data;
  const features = getFeatures(inv.package);
  const wantRsvp = !!input.attendance && features.rsvp;
  const wantWish = !!input.message && features.wishes;
  if (!wantRsvp && !wantWish)
    return { ok: false, status: 403, error: "Fitur ini tidak aktif di undangan ini." };

  // 1. Bot: diterima "seolah-olah" agar bot tidak belajar, tapi tidak disimpan.
  const age = now.getTime() - input.startedAt;
  if (input.website || age < MIN_FILL_MS) return { ok: true, stats: await guestbookStats(inv.id) };
  if (age > MAX_FORM_AGE_MS || input.startedAt > now.getTime() + 60_000)
    return {
      ok: false,
      status: 400,
      error: "Halaman sudah terlalu lama dibuka. Muat ulang lalu coba lagi.",
    };

  // 3–5. Rate limit dari baris di database (maks dari tabel Rsvp & Wish).
  const tenMin = { gte: new Date(now.getTime() - 10 * 60_000) };
  const oneMin = { gte: new Date(now.getTime() - 60_000) };
  type Window = {
    invitationId?: string;
    ipHash?: string;
    deviceId?: string | null;
    createdAt: { gte: Date };
  };
  const count = (where: Window) =>
    Promise.all([db.rsvp.count({ where }), db.wish.count({ where })]).then(([a, b]) =>
      Math.max(a, b),
    );
  const [perDevice, ipInv, ipAll, invMinute] = await Promise.all([
    count(
      deviceId
        ? { invitationId: inv.id, deviceId, createdAt: tenMin }
        : { invitationId: inv.id, ipHash, deviceId: null, createdAt: tenMin },
    ),
    count({ invitationId: inv.id, ipHash, createdAt: tenMin }),
    count({ ipHash, createdAt: tenMin }),
    count({ invitationId: inv.id, createdAt: oneMin }),
  ]);
  if (
    perDevice >= LIMITS.perDevice ||
    ipInv >= LIMITS.perIpInvitation ||
    ipAll >= LIMITS.perIpGlobal ||
    invMinute >= LIMITS.perInvitationMinute[inv.package]
  )
    return { ok: false, status: 429, error: RATE_LIMIT_MESSAGE, rateLimited: true };

  // 6. Duplikat (klik ganda / kirim ulang)
  if (wantWish) {
    const dup = await db.wish.findFirst({
      where: {
        invitationId: inv.id,
        ...(deviceId ? { deviceId } : { ipHash }),
        message: input.message,
        createdAt: { gte: new Date(now.getTime() - 3600_000) },
      },
    });
    if (dup) return { ok: true, wish: toPublic(dup), stats: await guestbookStats(inv.id) };
  }

  if (wantRsvp)
    await db.rsvp.create({
      data: {
        invitationId: inv.id,
        name: input.name,
        status: input.attendance!,
        pax: input.attendance === "HADIR" ? (input.pax ?? 1) : 1,
        message: input.message ?? null,
        ipHash,
        deviceId,
      },
    });
  const wish = wantWish
    ? await db.wish.create({
        data: {
          invitationId: inv.id,
          name: input.name,
          message: input.message!,
          attendance: input.attendance ?? null,
          ipHash,
          deviceId,
        },
      })
    : null;
  return { ok: true, wish: wish ? toPublic(wish) : undefined, stats: await guestbookStats(inv.id) };
}

/** Ucapan publik (tidak disembunyikan), terbaru dulu; `after` untuk polling. */
export async function listPublicWishes(slug: string, after?: Date) {
  const inv = await activeInvitation(slug);
  if (!inv) return null;
  if (!getFeatures(inv.package).wishes) return { wishes: [], stats: await guestbookStats(inv.id) };
  const rows = await db.wish.findMany({
    where: {
      invitationId: inv.id,
      isHidden: false,
      ...(after ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { wishes: rows.map(toPublic), stats: await guestbookStats(inv.id) };
}

// ------------------------------- Pemilik -------------------------------

async function owned(userId: string, invitationId: string) {
  const inv = await db.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true },
  });
  if (!inv) throw new Error("NOT_FOUND");
  return inv;
}

export async function ownerGuestbook(userId: string, invitationId: string) {
  await owned(userId, invitationId);
  const [wishes, rsvps, stats] = await Promise.all([
    db.wish.findMany({ where: { invitationId }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.rsvp.findMany({ where: { invitationId }, orderBy: { createdAt: "desc" }, take: 500 }),
    guestbookStats(invitationId),
  ]);
  return {
    stats,
    wishes: wishes.map((w) => ({ ...toPublic(w), isHidden: w.isHidden })),
    rsvps: rsvps.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      pax: r.pax,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function setWishHidden(
  userId: string,
  invitationId: string,
  wishId: string,
  hidden: boolean,
) {
  await owned(userId, invitationId);
  await db.wish.updateMany({ where: { id: wishId, invitationId }, data: { isHidden: hidden } });
}

export async function deleteWish(userId: string, invitationId: string, wishId: string) {
  await owned(userId, invitationId);
  await db.wish.deleteMany({ where: { id: wishId, invitationId } });
}

export async function deleteRsvp(userId: string, invitationId: string, rsvpId: string) {
  await owned(userId, invitationId);
  await db.rsvp.deleteMany({ where: { id: rsvpId, invitationId } });
}
