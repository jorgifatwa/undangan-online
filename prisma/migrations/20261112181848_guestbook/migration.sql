-- AlterTable
ALTER TABLE "Rsvp" ADD COLUMN     "ipHash" TEXT;

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "attendance" "RsvpStatus",
ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_ipHash_createdAt_idx" ON "Rsvp"("invitationId", "ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "Wish_invitationId_ipHash_createdAt_idx" ON "Wish"("invitationId", "ipHash", "createdAt");
