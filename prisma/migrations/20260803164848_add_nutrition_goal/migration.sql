-- CreateEnum
CREATE TYPE "NutritionGoal" AS ENUM ('PERDER_GRASA', 'GANAR_MUSCULO', 'MANTENER_PESO');

-- AlterTable
ALTER TABLE "NutritionProfile" ADD COLUMN     "goal" "NutritionGoal";
