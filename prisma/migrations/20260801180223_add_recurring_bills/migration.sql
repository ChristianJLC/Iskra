-- AlterTable
ALTER TABLE "FinanceEntry" ADD COLUMN     "recurringBillId" TEXT;

-- CreateTable
CREATE TABLE "RecurringBill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "startDay" INTEGER NOT NULL,
    "endDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringBill_userId_idx" ON "RecurringBill"("userId");

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_recurringBillId_fkey" FOREIGN KEY ("recurringBillId") REFERENCES "RecurringBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
