"use server";

import { requireMember } from "@/lib/auth-guard";
import { customerEditErrorById } from "@/lib/claims/guard";
import {
  UploadError,
  deleteByUrls,
  finalizePhoto,
  markAudioUploaded,
  mediaView,
  requestUpload,
  type UploadRequest,
} from "@/lib/media/service";
import { db } from "@/lib/db";

/**
 * Server action upload editor. Semua aturan ada di lib/media/service.ts;
 * di sini hanya: login wajib + ubah galat jadi hasil yang bisa ditampilkan.
 */
export type MediaResult<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: string;
      code?: "QUOTA" | "GALLERY_LIMIT" | "MUSIC_LIMIT" | "INVALID" | "NOT_FOUND";
    };

async function wrap<T>(fn: () => Promise<T>): Promise<MediaResult<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, error: e.message, code: e.code };
    console.error("[media]", e);
    return { ok: false, error: "Terjadi kesalahan. Coba lagi." };
  }
}

export async function requestUploadAction(invitationId: string, req: UploadRequest) {
  const user = await requireMember();
  const denied = await customerEditErrorById(user.role, invitationId);
  if (denied) return { ok: false as const, error: denied };
  return wrap(() => requestUpload(user.id, invitationId, req));
}

export async function finalizePhotoAction(mediaId: string) {
  const user = await requireMember();
  return wrap(() => finalizePhoto(user.id, mediaId));
}

export async function markAudioUploadedAction(mediaId: string) {
  const user = await requireMember();
  return wrap(() => markAudioUploaded(user.id, mediaId));
}

export async function mediaStatusAction(mediaId: string) {
  const user = await requireMember();
  return wrap(async () => {
    const m = await db.media.findFirst({ where: { id: mediaId, userId: user.id } });
    if (!m) throw new UploadError("File tidak ditemukan.", "NOT_FOUND");
    return { media: mediaView(m) };
  });
}

export async function deleteMediaAction(invitationId: string, urls: string[]) {
  const user = await requireMember();
  const denied = await customerEditErrorById(user.role, invitationId);
  if (denied) return { ok: false as const, error: denied };
  return wrap(async () => ({
    deleted: await deleteByUrls(user.id, invitationId, urls.slice(0, 100)),
  }));
}
