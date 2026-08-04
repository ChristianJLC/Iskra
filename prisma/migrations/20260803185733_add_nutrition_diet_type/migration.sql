-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('RECOMENDADA', 'ALTA_PROTEINA', 'BAJA_CARBOHIDRATOS', 'KETO', 'BAJA_GRASAS');

-- AlterTable
ALTER TABLE "NutritionProfile" ADD COLUMN     "dietType" "DietType";
