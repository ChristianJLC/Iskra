import { Dumbbell, Bed } from "lucide-react";
import type { ElementType } from "react";
import type { MuscleGroup } from "@/generated/prisma/client";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  PECHO: "Pecho",
  ESPALDA: "Espalda",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  HOMBROS: "Hombros",
  PIERNAS: "Piernas",
  ABDOMINALES: "Abdominales",
  GLUTEOS: "Glúteos",
  CARDIO: "Cardio",
  BOMBEO: "Bombeo",
};

export const MUSCLE_GROUP_OPTIONS: MuscleGroup[] = [
  "PECHO",
  "ESPALDA",
  "BICEPS",
  "TRICEPS",
  "HOMBROS",
  "PIERNAS",
  "ABDOMINALES",
  "GLUTEOS",
  "CARDIO",
  "BOMBEO",
];

export function formatMuscleGroups(groups: MuscleGroup[]): string {
  return groups.length === 0 ? "Descanso" : groups.map((group) => MUSCLE_GROUP_LABELS[group]).join(", ");
}

export function dayIcon(groups: MuscleGroup[]): ElementType {
  return groups.length === 0 ? Bed : Dumbbell;
}
