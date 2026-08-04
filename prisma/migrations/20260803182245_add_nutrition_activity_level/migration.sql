-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARIO', 'LIGERAMENTE_ACTIVO', 'MODERADAMENTE_ACTIVO', 'MUY_ACTIVO', 'ATLETA_PROFESIONAL');

-- AlterTable
ALTER TABLE "NutritionProfile" ADD COLUMN     "activityLevel" "ActivityLevel";
