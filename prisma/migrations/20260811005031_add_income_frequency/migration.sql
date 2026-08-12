-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('QUINCENAL', 'MENSUAL');

-- AlterTable
ALTER TABLE "FinanceSettings" ADD COLUMN     "incomeFrequency" "IncomeFrequency" NOT NULL DEFAULT 'QUINCENAL';
