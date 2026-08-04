-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('HOMBRE', 'MUJER');

-- AlterTable
ALTER TABLE "NutritionProfile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "weightKg" DOUBLE PRECISION;
