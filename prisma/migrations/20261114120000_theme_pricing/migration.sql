-- =============================================================================
-- Model harga: PAKET (FREE/BASIC/PREMIUM/EXCLUSIVE) → HARGA PER TEMA.
-- Urutan aman: tambah kolom/tabel baru → pindahkan data → hapus kolom lama.
--
-- Data lama:
--  - BASIC/PREMIUM/EXCLUSIVE dianggap SUDAH MEMBELI tema yang sedang dipakai:
--    purchasedAt = publishedAt (atau saat migrasi), ownedThemeIds = [themeId],
--    themeCredit = harga tema SAAT MIGRASI (Confetti 49.000, Renda 99.000,
--    Tirai 149.000 — sama dengan manifest per 14 Nov 2026), expiresAt = NULL.
--  - FREE tetap masa uji (tidak berubah).
--  - Order lama (kolom package) → satu OrderItem bertipe THEME.
-- =============================================================================

-- CreateEnum
CREATE TYPE "OrderItemKind" AS ENUM ('THEME', 'THEME_UPGRADE', 'ADDON');

-- AlterTable: kolom baru (package belum dihapus)
ALTER TABLE "Invitation"
ADD COLUMN     "ownedThemeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "purchasedAt" TIMESTAMP(3),
ADD COLUMN     "themeCredit" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" "OrderItemKind" NOT NULL,
    "refId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationAddon" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "invitationId" TEXT,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------- data lama --
UPDATE "Invitation"
SET "purchasedAt"   = COALESCE("publishedAt", CURRENT_TIMESTAMP),
    "ownedThemeIds" = ARRAY["themeId"],
    "themeCredit"   = CASE "themeId"
                        WHEN 'confetti-party' THEN 49000
                        WHEN 'renda-rimba'    THEN 99000
                        WHEN 'tirai-beludru'  THEN 149000
                        ELSE 0
                      END,
    "expiresAt"     = NULL
WHERE "package" <> 'FREE';

INSERT INTO "OrderItem" ("id", "orderId", "kind", "refId", "label", "unitPrice", "qty", "amount")
SELECT 'mig_' || o."id", o."id", 'THEME', i."themeId",
       'Paket lama ' || o."package"::text, o."amount", 1, o."amount"
FROM "Order" o
JOIN "Invitation" i ON i."id" = o."invitationId";

-- ------------------------------------------------------------ hapus yang lama --
ALTER TABLE "Invitation" DROP COLUMN "package";
ALTER TABLE "Order" DROP COLUMN "package";
DROP TYPE "PackageTier";

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "InvitationAddon_invitationId_idx" ON "InvitationAddon"("invitationId");
CREATE INDEX "AdminAudit_invitationId_idx" ON "AdminAudit"("invitationId");
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationAddon" ADD CONSTRAINT "InvitationAddon_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
