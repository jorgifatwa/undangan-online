"use server";

import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { findOwnedInvitation, type ActionResult } from "@/lib/invitations/access";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/invitations/slug";
import { getFeatures } from "@/lib/packages";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";

/** Ambil pesan galat pertama per path dari issue Zod. */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

export type SaveResult =
  | { ok: true; updatedAt: string }
  | { ok: false; conflict?: boolean; error: string; fieldErrors?: Record<string, string> };

/**
 * Autosave editor. Semua dicek ULANG di server (UI bisa diakali):
 *  1. login + pemilik undangan
 *  2. tema ada & mendukung jenis acara; varian milik tema itu
 *  3. data lolos schema Zod jenis acaranya
 *  4. section terkunci tema tetap tampil
 *  5. batasan paket (jumlah foto galeri)
 *  6. konkurensi optimis: tolak bila undangan sudah diubah di tab/perangkat lain
 */
export async function saveInvitation(
  id: string,
  payload: { data: unknown; themeId: string; colorVariant: string | null },
  baseUpdatedAt: string,
): Promise<SaveResult> {
  const user = await requireUser();
  const inv = await findOwnedInvitation(user.id, id);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };

  const manifest = getManifest(payload.themeId);
  if (!manifest || !manifest.eventTypes.includes(inv.eventType as never)) {
    return { ok: false, error: "Tema tidak tersedia untuk jenis acara ini." };
  }
  const variant =
    manifest.variants.find((v) => v.id === payload.colorVariant) ?? manifest.variants[0];

  const parsed = parseInvitationData(inv.eventType, payload.data);
  if (!parsed.ok) {
    const issues = "issues" in parsed.error ? parsed.error.issues : [];
    return {
      ok: false,
      error: "Ada isian yang belum valid.",
      fieldErrors: fieldErrors(issues as { path: PropertyKey[]; message: string }[]),
    };
  }
  const data = parsed.value.data;

  // Section terkunci tema baru selalu tampil (editor juga menguncinya).
  const locked = new Set<string>(manifest.lockedSections ?? []);
  data.sections = data.sections.map((s) => (locked.has(s.id) ? { ...s, visible: true } : s));

  const features = getFeatures(inv.package);
  if (features.galleryLimit !== null && data.gallery.length > features.galleryLimit) {
    return {
      ok: false,
      error: `Paket ${inv.package === "FREE" ? "Gratis" : inv.package} maksimal ${features.galleryLimit} foto galeri.`,
      fieldErrors: { gallery: `Maksimal ${features.galleryLimit} foto` },
    };
  }
  const ids = data.events.map((e) => e.id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Id acara ganda.", fieldErrors: { events: "Id acara ganda" } };
  }

  const res = await db.invitation.updateMany({
    where: { id, userId: user.id, updatedAt: new Date(baseUpdatedAt) },
    data: {
      data: data as unknown as Prisma.InputJsonValue,
      themeId: manifest.id,
      colorVariant: variant.id,
    },
  });
  if (res.count === 0) {
    return {
      ok: false,
      conflict: true,
      error: "Undangan ini baru saja diubah di tab atau perangkat lain.",
    };
  }
  const fresh = await db.invitation.findUnique({ where: { id }, select: { updatedAt: true } });
  return { ok: true, updatedAt: fresh!.updatedAt.toISOString() };
}

/** Ubah alamat undangan (slug → domain/{slug}). Unik, format aman, bukan nama rute website. */
export async function updateSlug(
  id: string,
  raw: string,
): Promise<ActionResult<{ slug: string; updatedAt: string }>> {
  const user = await requireUser();
  const inv = await findOwnedInvitation(user.id, id);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan." };

  const slug = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (slug === inv.slug)
    return { ok: true, value: { slug, updatedAt: inv.updatedAt.toISOString() } };
  if (RESERVED_SLUGS.has(slug))
    return { ok: false, error: "Alamat ini dicadangkan sistem. Pilih yang lain." };
  if (!isValidSlug(slug)) {
    return {
      ok: false,
      error: "3–40 karakter: huruf kecil, angka, dan tanda hubung (tidak di awal/akhir).",
    };
  }
  let updatedAt: Date;
  try {
    ({ updatedAt } = await db.invitation.update({
      where: { id: inv.id },
      data: { slug },
      select: { updatedAt: true },
    }));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Alamat ini sudah dipakai undangan lain." };
    }
    throw e;
  }
  return { ok: true, value: { slug, updatedAt: updatedAt.toISOString() } };
}
