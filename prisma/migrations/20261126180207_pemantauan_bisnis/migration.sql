-- AlterTable
ALTER TABLE "ClaimLink" ADD COLUMN     "receivedAmount" INTEGER;

-- CreateTable
CREATE TABLE "PageVisit" (
    "day" DATE NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("day","key")
);
