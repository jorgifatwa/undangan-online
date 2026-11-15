-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('NEW', 'PAID', 'PROCESSING', 'AWAITING_APPROVAL', 'PUBLISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "price" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "form" JSONB NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'NEW',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "adminNote" TEXT,
    "invitationId" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT,
    "deviceId" TEXT,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerLink" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_invitationId_key" ON "Booking"("invitationId");

-- CreateIndex
CREATE INDEX "Booking_status_updatedAt_idx" ON "Booking"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_ipHash_createdAt_idx" ON "Booking"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_deviceId_createdAt_idx" ON "Booking"("deviceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerLink_tokenHash_key" ON "OwnerLink"("tokenHash");

-- CreateIndex
CREATE INDEX "OwnerLink_invitationId_idx" ON "OwnerLink"("invitationId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerLink" ADD CONSTRAINT "OwnerLink_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
