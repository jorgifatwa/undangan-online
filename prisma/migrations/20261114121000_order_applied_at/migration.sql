-- Penanda pesanan sudah diterapkan ke undangan (applyPaidOrder idempoten).
ALTER TABLE "Order" ADD COLUMN "appliedAt" TIMESTAMP(3);
