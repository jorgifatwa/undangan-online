-- =============================================================================
-- Hapus MASA UJI 3 HARI. Model baru: draf gratis tanpa batas waktu; TERBIT hanya
-- setelah tema dibeli. Tambah penangguhan admin & link pratinjau rahasia.
--
-- Data lama:
--  - undangan yang BELUM dibeli tapi berstatus PUBLISHED/EXPIRED → DRAFT
--  - lastEditedAt diisi dari updatedAt (perubahan terakhir yang diketahui)
--  - kolom expiresAt & nilai status EXPIRED dihapus
-- =============================================================================

-- 1. Kolom baru (expiresAt belum dihapus)
ALTER TABLE "Invitation"
ADD COLUMN     "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "suspendReason" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

UPDATE "Invitation" SET "lastEditedAt" = "updatedAt";

-- 2. Undangan belum dibeli tidak boleh terbit; EXPIRED tidak ada lagi
UPDATE "Invitation" SET "status" = 'DRAFT'
WHERE "status" = 'EXPIRED' OR ("status" = 'PUBLISHED' AND "purchasedAt" IS NULL);

-- 3. Enum tanpa EXPIRED
BEGIN;
CREATE TYPE "InvitationStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."Invitation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invitation" ALTER COLUMN "status" TYPE "InvitationStatus_new" USING ("status"::text::"InvitationStatus_new");
ALTER TYPE "InvitationStatus" RENAME TO "InvitationStatus_old";
ALTER TYPE "InvitationStatus_new" RENAME TO "InvitationStatus";
DROP TYPE "public"."InvitationStatus_old";
ALTER TABLE "Invitation" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- 4. Hapus kedaluwarsa
DROP INDEX "Invitation_status_expiresAt_idx";
ALTER TABLE "Invitation" DROP COLUMN "expiresAt";

-- 5. Link pratinjau
CREATE TABLE "PreviewLink" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PreviewLink_tokenHash_key" ON "PreviewLink"("tokenHash");
CREATE INDEX "PreviewLink_invitationId_idx" ON "PreviewLink"("invitationId");
ALTER TABLE "PreviewLink" ADD CONSTRAINT "PreviewLink_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Indeks
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");
CREATE INDEX "Invitation_purchasedAt_lastEditedAt_idx" ON "Invitation"("purchasedAt", "lastEditedAt");
