-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('PECHO', 'ESPALDA', 'BICEPS', 'TRICEPS', 'HOMBROS', 'PIERNAS', 'ABDOMINALES', 'GLUTEOS', 'CARDIO');

-- Add new array columns alongside the old single-enum columns so we can backfill before dropping anything
ALTER TABLE "WorkoutSchedule"
  ADD COLUMN "monday_new"    "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "tuesday_new"   "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "wednesday_new" "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "thursday_new"  "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "friday_new"    "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "saturday_new"  "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "sunday_new"    "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[];

ALTER TABLE "WorkoutCompletion"
  ADD COLUMN "groups_new" "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[];

-- Backfill: map the old fixed combos to the new individual muscle groups
UPDATE "WorkoutSchedule" SET
  "monday_new" = CASE "monday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "tuesday_new" = CASE "tuesday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "wednesday_new" = CASE "wednesday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "thursday_new" = CASE "thursday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "friday_new" = CASE "friday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "saturday_new" = CASE "saturday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END,
  "sunday_new" = CASE "sunday"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END;

UPDATE "WorkoutCompletion" SET
  "groups_new" = CASE "group"::text
    WHEN 'PECHO_BICEPS' THEN ARRAY['PECHO','BICEPS']::"MuscleGroup"[]
    WHEN 'ESPALDA_TRICEPS' THEN ARRAY['ESPALDA','TRICEPS']::"MuscleGroup"[]
    WHEN 'PIERNAS_ABDOMINALES' THEN ARRAY['PIERNAS','ABDOMINALES']::"MuscleGroup"[]
    WHEN 'BOMBEO' THEN ARRAY['PECHO','ESPALDA','BICEPS','TRICEPS','HOMBROS','PIERNAS','ABDOMINALES','GLUTEOS']::"MuscleGroup"[]
    ELSE ARRAY[]::"MuscleGroup"[]
  END;

-- Drop the old single-enum columns
ALTER TABLE "WorkoutSchedule"
  DROP COLUMN "monday",
  DROP COLUMN "tuesday",
  DROP COLUMN "wednesday",
  DROP COLUMN "thursday",
  DROP COLUMN "friday",
  DROP COLUMN "saturday",
  DROP COLUMN "sunday";

ALTER TABLE "WorkoutCompletion"
  DROP COLUMN "group";

-- Rename the new columns to their final names
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "monday_new" TO "monday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "tuesday_new" TO "tuesday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "wednesday_new" TO "wednesday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "thursday_new" TO "thursday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "friday_new" TO "friday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "saturday_new" TO "saturday";
ALTER TABLE "WorkoutSchedule" RENAME COLUMN "sunday_new" TO "sunday";

ALTER TABLE "WorkoutCompletion" RENAME COLUMN "groups_new" TO "groups";

-- Drop the old enum type
DROP TYPE "RoutineGroup";
