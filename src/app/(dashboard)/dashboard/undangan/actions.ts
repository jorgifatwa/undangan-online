"use server";

import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/invitations/access";
import { buildInitialData, slugBase, wizardSchema } from "@/lib/invitations/initial-data";
import { uniqueSlug } from "@/lib/invitations/slug";
import { getManifest } from "@/themes/registry";

/** Batas undangan per akun (anti penyalahgunaan; draf lama bisa dihapus). */
const MAX_INVITATIONS_PER_USER = 30;

/** Ambil pesan galat pertama per field dari ZodError → { "brideName": "…" }. */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

/**
 * Wizard → undangan baru: draf, paket FREE, data awal dari isian user (tanpa
 * data contoh), slug unik dari nama. Semua dicek ulang di server.
 */
export async function createInvitation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();

  const parsed = wizardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian yang ditandai.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const v = parsed.data;

  const manifest = getManifest(v.themeId);
  if (!manifest || !manifest.eventTypes.includes(v.eventType)) {
    return {
      ok: false,
      error: "Tema tidak tersedia untuk jenis acara ini.",
      fieldErrors: { themeId: "Pilih tema lain" },
    };
  }

  const count = await db.invitation.count({ where: { userId: user.id } });
  if (count >= MAX_INVITATIONS_PER_USER) {
    return {
      ok: false,
      error: `Maksimal ${MAX_INVITATIONS_PER_USER} undangan per akun. Hapus draf yang tidak dipakai.`,
    };
  }

  const initial = buildInitialData(v);
  // Slug unik; bila bentrok di detik yang sama (balapan), coba lagi.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const created = await db.invitation.create({
        data: {
          userId: user.id,
          slug: await uniqueSlug(slugBase(v)),
          eventType: v.eventType,
          themeId: manifest.id,
          colorVariant: manifest.variants[0].id,
          data: initial.data as Prisma.InputJsonValue,
          package: "FREE",
          status: "DRAFT",
        },
        select: { id: true },
      });
      return { ok: true, value: { id: created.id } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false, error: "Gagal membuat alamat undangan. Coba lagi." };
}
