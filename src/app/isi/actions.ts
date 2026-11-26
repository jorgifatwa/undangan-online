"use server";

import { Prisma } from "@prisma/client";

import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { publishChecklist } from "@/lib/invitations/publish";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/invitations/slug";
import { getSettings } from "@/lib/settings";
import { invitationUrl } from "@/lib/site";

/**
 * Aksi pembeli di link khusus (sesi CUSTOMER dibuat saat link dibuka).
 * Semua memeriksa: login CUSTOMER + pemilik undangan + link masih OPEN.
 */
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function openClaim(invitationId: string) {
  const user = await requireCustomer();
  const inv = await db.invitation.findFirst({
    where: { id: String(invitationId), userId: user.id },
    include: { claim: true },
  });
  if (!inv?.claim) return null;
  if (claimPhase(inv.claim, inv) !== "open") return null;
  return { user, inv, claim: inv.claim };
}

const CLOSED = "Link ini sudah tidak bisa dipakai untuk mengisi. Hubungi admin.";

/** Simpan posisi langkah (dibuka lagi nanti → lanjut dari langkah ini). */
export async function saveClaimStepAction(invitationId: string, step: number): Promise<R> {
  const c = await openClaim(invitationId);
  if (!c) return { ok: false, error: CLOSED };
  const n = Math.max(0, Math.min(50, Math.trunc(Number(step) || 0)));
  await db.claimLink.update({
    where: { id: c.claim.id },
    data: { step: n, lastUsedAt: new Date() },
  });
  return { ok: true };
}

function slugProblem(slug: string): string | null {
  if (slug.startsWith("draf-")) return "Alamat tidak boleh diawali “draf-”.";
  if (RESERVED_SLUGS.has(slug)) return "Alamat ini dicadangkan sistem. Pilih yang lain.";
  if (!isValidSlug(slug))
    return "3–40 karakter: huruf kecil, angka, dan tanda hubung (tidak di awal/akhir).";
  return null;
}

/** Cek ketersediaan alamat domain/{slug}. */
export async function checkSlugAction(
  invitationId: string,
  raw: string,
): Promise<R<{ slug: string; available: boolean; message?: string }>> {
  const c = await openClaim(invitationId);
  if (!c) return { ok: false, error: CLOSED };
  const slug = String(raw ?? "")
    .trim()
    .toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { ok: true, slug, available: false, message: problem };
  const taken = await db.invitation.findFirst({
    where: { slug, NOT: { id: c.inv.id } },
    select: { id: true },
  });
  return taken
    ? { ok: true, slug, available: false, message: "Alamat ini sudah dipakai. Coba yang lain." }
    : { ok: true, slug, available: true };
}

/**
 * KONFIRMASI: pasang alamat pilihan, tayangkan undangan, kunci tema, mulai
 * masa aktif (pengaturan global). Tidak bisa dibatalkan pembeli.
 */
export async function confirmClaimAction(
  invitationId: string,
  raw: string,
): Promise<R<{ url: string }>> {
  const c = await openClaim(invitationId);
  if (!c) return { ok: false, error: CLOSED };
  const slug = String(raw ?? "")
    .trim()
    .toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem };

  const failed = publishChecklist({ ...c.inv, slug }).filter(
    (i) => i.severity === "error" && !i.ok,
  );
  if (failed.length) return { ok: false, error: failed[0].message ?? failed[0].label };

  const now = new Date();
  const { invitationActiveDays } = await getSettings();
  try {
    await db.$transaction(async (tx) => {
      // status OPEN di WHERE: dua klik konfirmasi bersamaan → hanya satu yang lolos
      const r = await tx.claimLink.updateMany({
        where: { id: c.claim.id, status: "OPEN", expiresAt: { gt: now } },
        data: { status: "CONFIRMED", confirmedAt: now, lastUsedAt: now },
      });
      if (r.count === 0) throw new Error("CLOSED");
      await tx.invitation.update({
        where: { id: c.inv.id },
        data: {
          slug,
          status: "PUBLISHED",
          publishedAt: c.inv.publishedAt ?? now,
          activeUntil: new Date(now.getTime() + invitationActiveDays * 86400_000),
          // tema terkunci: hanya tema yang sedang dipakai yang dimiliki
          ownedThemeIds: [c.inv.themeId],
          lastEditedAt: now,
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, error: "Alamat ini baru saja dipakai undangan lain. Pilih yang lain." };
    if (e instanceof Error && e.message === "CLOSED") return { ok: false, error: CLOSED };
    throw e;
  }
  return { ok: true, url: invitationUrl(slug) };
}
