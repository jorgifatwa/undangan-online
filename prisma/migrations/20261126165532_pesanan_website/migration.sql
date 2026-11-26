-- CreateEnum
CREATE TYPE "WebOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "WebOrder" (
    "id" TEXT NOT NULL,
    "midtransOrderId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "colorVariant" TEXT,
    "eventType" "EventType" NOT NULL,
    "data" JSONB NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WebOrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT,
    "snapToken" TEXT,
    "redirectUrl" TEXT,
    "rawNotification" JSONB,
    "paidAt" TIMESTAMP(3),
    "viewKeyHash" TEXT NOT NULL,
    "claimTokenEnc" TEXT,
    "claimId" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebOrder_midtransOrderId_key" ON "WebOrder"("midtransOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "WebOrder_claimId_key" ON "WebOrder"("claimId");

-- CreateIndex
CREATE INDEX "WebOrder_status_createdAt_idx" ON "WebOrder"("status", "createdAt");
