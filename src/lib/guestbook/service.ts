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
 *  3. per IP per undangan: maks 5 kiriman / 10 menit
 *  4. per IP lintas undangan: maks 20 kiriman / 10 menit
 *  5. per undangan (banjir dari banyak IP): maks 30 kiriman / menit
 *  6. ucapan sama persis dari IP yang sama dalam 1 jam → tidak digandakan
 */
const MIN_FILL_MS = 3000;
const MAX_FORM_AGE_MS = 7 * 86400_000;
const LIMITS = { perIpInvitation: 5, perIpGlobal: 20, perInvitationMinute: 30 };

export interface PublicWish {
  id: string;
  name: string;
  message: string;
  attendance?: RsvpStatus;
  createdAt: string;
}

export type SubmitResult =
  | { ok: true; wish?: PublicWish; stats: GuestbookStats }
  | { ok: false; status: number; error: string };

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
  ipHash: string,
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

  // 3–5. Rate limit dari baris di database.
  const tenMin = new Date(now.getTime() - 10 * 60_000);
  const oneMin = new Date(now.getTime() - 60_000);
  const [ipInv, ipAll, invMinute] = await Promise.all([
    Promise.all([
      db.rsvp.count({ where: { invitationId: inv.id, ipHash, createdAt: { gte: tenMin } } }),
      db.wish.count({ where: { invitationId: inv.id, ipHash, createdAt: { gte: tenMin } } }),
    ]).then(([a, b]) => Math.max(a, b)),
    Promise.all([
      db.rsvp.count({ where: { ipHash, createdAt: { gte: tenMin } } }),
      db.wish.count({ where: { ipHash, createdAt: { gte: tenMin } } }),
    ]).then(([a, b]) => Math.max(a, b)),
    Promise.all([
      db.rsvp.count({ where: { invitationId: inv.id, createdAt: { gte: oneMin } } }),
      db.wish.count({ where: { invitationId: inv.id, createdAt: { gte: oneMin } } }),
    ]).then(([a, b]) => Math.max(a, b)),
  ]);
  if (ipInv >= LIMITS.perIpInvitation || ipAll >= LIMITS.perIpGlobal)
    return {
      ok: false,
      status: 429,
      error: "Terlalu banyak kiriman dari perangkat ini. Coba lagi beberapa menit lagi.",
    };
  if (invMinute >= LIMITS.perInvitationMinute)
    return { ok: false, status: 429, error: "Undangan ini sedang ramai. Coba lagi sebentar lagi." };

  // 6. Duplikat (klik ganda / kirim ulang)
  if (wantWish) {
    const dup = await db.wish.findFirst({
      where: {
        invitationId: inv.id,
        ipHash,
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
