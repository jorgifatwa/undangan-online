-- CreateEnum
CREATE TYPE "ClaimSource" AS ENUM ('MARKETPLACE', 'WEBSITE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('OPEN', 'CONFIRMED', 'REVOKED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "activeUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ClaimLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "source" "ClaimSource" NOT NULL,
    "marketplace" TEXT,
    "marketplaceOrder" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "price" INTEGER NOT NULL,
    "invitationId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'OPEN',
    "step" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLink_code_key" ON "ClaimLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLink_tokenHash_key" ON "ClaimLink"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLink_invitationId_key" ON "ClaimLink"("invitationId");

-- CreateIndex
CREATE INDEX "ClaimLink_status_expiresAt_idx" ON "ClaimLink"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ClaimLink_createdAt_idx" ON "ClaimLink"("createdAt");

-- AddForeignKey
ALTER TABLE "ClaimLink" ADD CONSTRAINT "ClaimLink_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
