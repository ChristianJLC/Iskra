-- CreateEnum
CREATE TYPE "WeightChangeSpeed" AS ENUM ('RECOMENDADO', 'RAPIDO', 'LENTO');

-- AlterTable
ALTER TABLE "NutritionProfile" ADD COLUMN     "speed" "WeightChangeSpeed",
ADD COLUMN     "targetWeightKg" DOUBLE PRECISION;
