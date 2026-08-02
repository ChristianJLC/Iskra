/*
  Warnings:

  - You are about to drop the `ExerciseEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RoutineGroup" AS ENUM ('DESCANSO', 'PECHO_BICEPS', 'ESPALDA_TRICEPS', 'PIERNAS_ABDOMINALES', 'BOMBEO');

-- DropForeignKey
ALTER TABLE "ExerciseEntry" DROP CONSTRAINT "ExerciseEntry_userId_fkey";

-- DropTable
DROP TABLE "ExerciseEntry";

-- CreateTable
CREATE TABLE "WorkoutSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "tuesday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "wednesday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "thursday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "friday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "saturday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "sunday" "RoutineGroup" NOT NULL DEFAULT 'DESCANSO',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "group" "RoutineGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSchedule_userId_key" ON "WorkoutSchedule"("userId");

-- CreateIndex
CREATE INDEX "WorkoutCompletion_userId_date_idx" ON "WorkoutCompletion"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutCompletion_userId_date_key" ON "WorkoutCompletion"("userId", "date");

-- AddForeignKey
ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
