/**
 * PENANGGUHAN undangan oleh admin (mis. penipuan, konten melanggar, keluhan sah).
 *
 *   pnpm admin:suspend   <slug> --by="Nama Admin" --reason="Alasan yang dilihat pemilik"
 *   pnpm admin:unsuspend <slug> --by="Nama Admin" [--note="hasil banding"]
 *
 * Ditangguhkan → halaman tamu, link pratinjau, gambar OG, dan API RSVP/ucapan
 * 404 seperti undangan tidak ada; pemilik melihat "Ditangguhkan" + alasan di
 * dashboard/editor dan tidak bisa menerbitkan ulang. Link pratinjau yang ada
 * dicabut (tidak hidup lagi setelah dipulihkan). Status terbit & lastEditedAt
 * TIDAK diubah, updatedAt dipertahankan (deteksi konflik editor) — setelah
 * dipulihkan undangan kembali seperti semula.
 * Setiap pemakaian dicatat di AdminAudit. Ditolak di production kecuali
 * ALLOW_ADMIN_SUSPEND=1.
 */
import { PrismaClient, type Prisma } from "@prisma/client";

import { adminActor, assertAdminAllowed, cliArgs } from "./lib/admin";

const { opt, positional } = cliArgs();
const mode = positional[0];
const slug = positional[1];
const by = opt("by")?.trim();
const reason = opt("reason")?.trim();
const note = opt("note")?.trim() ?? null;

async function main() {
  if ((mode !== "suspend" && mode !== "unsuspend") || !slug || !by) {
    console.error(
      'Pakai: pnpm admin:suspend <slug> --by="Nama Admin" --reason="..."\n' +
        '      pnpm admin:unsuspend <slug> --by="Nama Admin" [--note="..."]',
    );
    process.exit(1);
  }
  if (mode === "suspend" && (!reason || reason.length < 5 || reason.length > 500)) {
    console.error("✗ --reason wajib diisi (5–500 karakter); alasan ini ditampilkan ke pemilik.");
    process.exit(1);
  }
  const { host, production } = assertAdminAllowed(`admin:${mode}`, "ALLOW_ADMIN_SUSPEND");
  const db = new PrismaClient();
  try {
    const inv = await db.invitation.findUnique({
      where: { slug },
      select: { id: true, status: true, suspendedAt: true, suspendReason: true, updatedAt: true },
    });
    if (!inv) throw new Error(`Undangan "${slug}" tidak ditemukan.`);
    const now = new Date();
    const actor = adminActor(by);
    let revoked = 0;
    await db.$transaction(async (tx) => {
      if (mode === "suspend") {
        await tx.invitation.update({
          where: { id: inv.id },
          data: { suspendedAt: now, suspendReason: reason, updatedAt: inv.updatedAt },
        });
        revoked = (
          await tx.previewLink.updateMany({
            where: { invitationId: inv.id, revokedAt: null },
            data: { revokedAt: now },
          })
        ).count;
      } else {
        if (!inv.suspendedAt) throw new Error(`Undangan "${slug}" tidak sedang ditangguhkan.`);
        await tx.invitation.update({
          where: { id: inv.id },
          data: { suspendedAt: null, suspendReason: null, updatedAt: inv.updatedAt },
        });
      }
      await tx.adminAudit.create({
        data: {
          actor,
          action: mode,
          invitationId: inv.id,
          detail: {
            slug,
            status: inv.status,
            reason: mode === "suspend" ? reason : null,
            previousReason: mode === "unsuspend" ? inv.suspendReason : null,
            revokedPreviewLinks: revoked,
            note,
            dbHost: host,
            production,
          } as Prisma.InputJsonValue,
        },
      });
    });
    console.log(
      mode === "suspend"
        ? `✓ ${slug} DITANGGUHKAN (${inv.status}) · ${revoked} link pratinjau dicabut · alasan: ${reason}`
        : `✓ ${slug} dipulihkan (status ${inv.status})`,
    );
    console.log(`  tercatat di AdminAudit oleh ${actor}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
