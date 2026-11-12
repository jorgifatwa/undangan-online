-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "slot" TEXT NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "key" TEXT,
    "rawKey" TEXT,
    "mime" TEXT,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "rightsAcceptedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_userId_status_idx" ON "Media"("userId", "status");

-- CreateIndex
CREATE INDEX "Media_invitationId_slot_idx" ON "Media"("invitationId", "slot");

-- CreateIndex
CREATE INDEX "Media_status_createdAt_idx" ON "Media"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
