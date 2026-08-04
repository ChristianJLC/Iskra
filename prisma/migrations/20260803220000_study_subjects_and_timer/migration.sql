-- CreateTable
CREATE TABLE "StudySubject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudySubject_userId_name_key" ON "StudySubject"("userId", "name");

-- AddForeignKey
ALTER TABLE "StudySubject" ADD CONSTRAINT "StudySubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new columns to StudyEntry alongside the old ones so we can backfill before dropping anything
ALTER TABLE "StudyEntry"
  ADD COLUMN "subjectId" TEXT,
  ADD COLUMN "subjectName" TEXT,
  ADD COLUMN "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "runningSince" TIMESTAMP(3);

-- Backfill: keep the free-text subject as the snapshot name, and convert minutes already logged into seconds
UPDATE "StudyEntry" SET
  "subjectName" = "subject",
  "accumulatedSeconds" = "actualMinutes" * 60;

-- subjectName is required going forward
ALTER TABLE "StudyEntry" ALTER COLUMN "subjectName" SET NOT NULL;

-- Drop the old columns
ALTER TABLE "StudyEntry"
  DROP COLUMN "subject",
  DROP COLUMN "actualMinutes";

-- AddForeignKey
ALTER TABLE "StudyEntry" ADD CONSTRAINT "StudyEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "StudySubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop stray default left over from the muscle-groups migration (schema declares no default here)
ALTER TABLE "WorkoutCompletion" ALTER COLUMN "groups" DROP DEFAULT;
