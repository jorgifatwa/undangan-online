-- AlterTable
ALTER TABLE "Rsvp" ADD COLUMN     "deviceId" TEXT;

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "deviceId" TEXT;

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_deviceId_createdAt_idx" ON "Rsvp"("invitationId", "deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "Wish_invitationId_deviceId_createdAt_idx" ON "Wish"("invitationId", "deviceId", "createdAt");
