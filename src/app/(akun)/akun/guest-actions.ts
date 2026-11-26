"use server";

import { z } from "zod";

import { requireMember } from "@/lib/auth-guard";
import {
  GuestError,
  addGuests,
  deleteGuests,
  listGuests,
  markGuestsSent,
  parseBulk,
  updateGuest,
} from "@/lib/guests/service";

/** Aksi daftar tamu (pembeli & admin; kepemilikan dicek di service). */
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T extends object>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof GuestError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0].message };
    console.error("[guests]", e);
    return { ok: false, error: "Terjadi kesalahan. Coba lagi." };
  }
}

const ids = z.array(z.string().max(40)).max(2000);

export async function listGuestsAction(invitationId: string) {
  const user = await requireMember();
  return run(async () => ({ guests: await listGuests(user.id, invitationId) }));
}

export async function addGuestAction(
  invitationId: string,
  input: { name: string; phone?: string; group?: string },
) {
  const user = await requireMember();
  return run(() => addGuests(user.id, invitationId, [input]));
}

export async function addGuestsBulkAction(invitationId: string, text: string, group?: string) {
  const user = await requireMember();
  return run(() =>
    addGuests(
      user.id,
      invitationId,
      parseBulk(String(text ?? "").slice(0, 100_000)).map((g) => ({
        ...g,
        group: g.group ?? (group || null),
      })),
    ),
  );
}

export async function updateGuestAction(
  invitationId: string,
  guestId: string,
  input: { name: string; phone?: string; group?: string },
) {
  const user = await requireMember();
  return run(async () => {
    await updateGuest(user.id, invitationId, String(guestId), input);
    return {};
  });
}

export async function deleteGuestsAction(invitationId: string, guestIds: string[]) {
  const user = await requireMember();
  return run(async () => ({
    deleted: await deleteGuests(user.id, invitationId, ids.parse(guestIds)),
  }));
}

export async function markSentAction(invitationId: string, guestIds: string[], sent: boolean) {
  const user = await requireMember();
  return run(async () => ({
    updated: await markGuestsSent(user.id, invitationId, ids.parse(guestIds), Boolean(sent)),
  }));
}
