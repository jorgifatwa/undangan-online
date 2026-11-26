import "server-only";

import { randomBytes } from "node:crypto";

import { z } from "zod";

import { db } from "@/lib/db";
import { normalizeWaNumber } from "@/lib/invitations/share";

/**
 * DAFTAR TAMU milik pemilik undangan (pembeli / admin) untuk mengirim
 * undangan personal lewat WhatsApp. Semua fungsi memeriksa kepemilikan.
 */
export const MAX_GUESTS = 2000;
export const MAX_BULK = 500;

export class GuestError extends Error {}

async function owned(userId: string, invitationId: string) {
  const inv = await db.invitation.findFirst({
    where: { id: String(invitationId), userId },
    select: { id: true },
  });
  if (!inv) throw new GuestError("Undangan tidak ditemukan.");
  return inv;
}

const nameSchema = z
  .string()
  .transform((v) =>
    v
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  )
  .pipe(z.string().min(1, "Nama tamu wajib diisi").max(80, "Nama maksimal 80 karakter"));
const groupSchema = z
  .string()
  .transform((v) =>
    v
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .trim()
      .slice(0, 40),
  )
  .optional();

export interface GuestInput {
  name: string;
  phone?: string | null;
  group?: string | null;
}

function slugBase(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "tamu"
  );
}

function clean(input: GuestInput) {
  const name = nameSchema.parse(input.name);
  const phoneRaw = input.phone?.trim();
  const phone = phoneRaw ? normalizeWaNumber(phoneRaw) : null;
  if (phoneRaw && !phone) throw new GuestError(`Nomor WA "${phoneRaw}" tidak valid.`);
  const group = groupSchema.parse(input.group ?? undefined) || null;
  return { name, phone, group };
}

export function guestView(g: {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  phone: string | null;
  sentAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: g.id,
    name: g.name,
    slug: g.slug,
    group: g.group,
    phone: g.phone,
    sentAt: g.sentAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}
export type GuestView = ReturnType<typeof guestView>;

export async function listGuests(userId: string, invitationId: string) {
  await owned(userId, invitationId);
  const rows = await db.guest.findMany({
    where: { invitationId },
    orderBy: [{ createdAt: "desc" }],
    take: MAX_GUESTS,
  });
  return rows.map(guestView);
}

/** Tambah satu / banyak tamu. Baris yang gagal dilaporkan, sisanya tetap masuk. */
export async function addGuests(userId: string, invitationId: string, inputs: GuestInput[]) {
  await owned(userId, invitationId);
  if (inputs.length === 0) throw new GuestError("Tidak ada tamu untuk ditambahkan.");
  if (inputs.length > MAX_BULK) throw new GuestError(`Maksimal ${MAX_BULK} tamu sekali tambah.`);
  const count = await db.guest.count({ where: { invitationId } });
  if (count + inputs.length > MAX_GUESTS)
    throw new GuestError(`Maksimal ${MAX_GUESTS} tamu per undangan.`);

  const errors: string[] = [];
  const rows: { name: string; phone: string | null; group: string | null; slug: string }[] = [];
  for (const [i, input] of inputs.entries()) {
    try {
      const c = clean(input);
      rows.push({ ...c, slug: `${slugBase(c.name)}-${randomBytes(3).toString("hex")}` });
    } catch (e) {
      const msg =
        e instanceof GuestError
          ? e.message
          : e instanceof z.ZodError
            ? e.issues[0].message
            : "tidak valid";
      errors.push(`Baris ${i + 1}: ${msg}`);
    }
  }
  if (rows.length)
    await db.guest.createMany({
      data: rows.map((r) => ({ ...r, invitationId })),
      skipDuplicates: true,
    });
  return { added: rows.length, errors };
}

export async function updateGuest(
  userId: string,
  invitationId: string,
  guestId: string,
  input: GuestInput,
) {
  await owned(userId, invitationId);
  const c = clean(input);
  const r = await db.guest.updateMany({ where: { id: guestId, invitationId }, data: c });
  if (r.count === 0) throw new GuestError("Tamu tidak ditemukan.");
}

export async function deleteGuests(userId: string, invitationId: string, ids: string[]) {
  await owned(userId, invitationId);
  const r = await db.guest.deleteMany({
    where: { id: { in: ids.slice(0, MAX_GUESTS) }, invitationId },
  });
  return r.count;
}

/** Tandai terkirim (sent=true) atau reset (sent=false). */
export async function markGuestsSent(
  userId: string,
  invitationId: string,
  ids: string[],
  sent: boolean,
) {
  await owned(userId, invitationId);
  const r = await db.guest.updateMany({
    where: { id: { in: ids.slice(0, MAX_GUESTS) }, invitationId },
    data: { sentAt: sent ? new Date() : null },
  });
  return r.count;
}

/**
 * Tempel massal: satu tamu per baris — "Nama", "Nama, 08xx", atau
 * "Nama, 08xx, Grup". Baris kosong diabaikan.
 */
export function parseBulk(text: string): GuestInput[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", phone = "", ...rest] = line.split(/[,;\t]/).map((x) => x.trim());
      return { name, phone: phone || null, group: rest.join(" ").trim() || null };
    });
}
