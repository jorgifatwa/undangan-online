"use server";

import { requireUser } from "@/lib/auth-guard";
import { deleteRsvp, deleteWish, ownerGuestbook, setWishHidden } from "@/lib/guestbook/service";

/** Moderasi buku tamu oleh pemilik undangan (dicek kepemilikannya di service). */
type R<T> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch {
    return { ok: false, error: "Undangan tidak ditemukan." };
  }
}

export async function guestbookAction(invitationId: string) {
  const user = await requireUser();
  return run(() => ownerGuestbook(user.id, invitationId));
}

export async function hideWishAction(invitationId: string, wishId: string, hidden: boolean) {
  const user = await requireUser();
  return run(async () => {
    await setWishHidden(user.id, invitationId, wishId, hidden);
    return {};
  });
}

export async function deleteWishAction(invitationId: string, wishId: string) {
  const user = await requireUser();
  return run(async () => {
    await deleteWish(user.id, invitationId, wishId);
    return {};
  });
}

export async function deleteRsvpAction(invitationId: string, rsvpId: string) {
  const user = await requireUser();
  return run(async () => {
    await deleteRsvp(user.id, invitationId, rsvpId);
    return {};
  });
}
