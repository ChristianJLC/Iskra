-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('TRABAJO', 'PERSONAL', 'CASA', 'ESTUDIO', 'SALUD', 'COMPRAS');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" "TaskCategory";
