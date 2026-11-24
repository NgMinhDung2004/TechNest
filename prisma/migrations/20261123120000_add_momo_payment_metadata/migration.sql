ALTER TYPE "PaymentMethod" ADD VALUE 'MOMO';

ALTER TABLE "Order"
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paymentTransactionId" TEXT;

CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
CREATE UNIQUE INDEX "Order_paymentTransactionId_key" ON "Order"("paymentTransactionId");
