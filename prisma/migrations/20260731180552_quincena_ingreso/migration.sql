-- Rename FinanceSettings.monthlyIncome to biweeklyIncome (now represents the fixed biweekly payment amount)
ALTER TABLE "FinanceSettings" RENAME COLUMN "monthlyIncome" TO "biweeklyIncome";

-- Recreate FinanceType enum: add INGRESO, drop legacy PROPINA (no existing rows use this column)
ALTER TABLE "FinanceEntry" ALTER COLUMN "type" TYPE TEXT;
DROP TYPE "FinanceType";
CREATE TYPE "FinanceType" AS ENUM ('INGRESO', 'EXTRA', 'GASTO');
ALTER TABLE "FinanceEntry" ALTER COLUMN "type" TYPE "FinanceType" USING ("type"::"FinanceType");
