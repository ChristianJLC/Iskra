import { Bed, Dumbbell } from "lucide-react";
import type { ElementType } from "react";
import type { RoutineGroup } from "@/generated/prisma/client";
import { ChestBicepsIcon, BackTricepsIcon, LegsAbsIcon } from "@/components/icons/routine-icons";

export const ROUTINE_GROUP_LABELS: Record<RoutineGroup, string> = {
  DESCANSO: "Descanso",
  PECHO_BICEPS: "Pecho y Bíceps",
  ESPALDA_TRICEPS: "Espalda y Tríceps",
  PIERNAS_ABDOMINALES: "Piernas y Abdominales",
  BOMBEO: "Bombeo",
};

export const ROUTINE_GROUP_ICONS: Record<RoutineGroup, ElementType> = {
  DESCANSO: Bed,
  PECHO_BICEPS: ChestBicepsIcon,
  ESPALDA_TRICEPS: BackTricepsIcon,
  PIERNAS_ABDOMINALES: LegsAbsIcon,
  BOMBEO: Dumbbell,
};

export const ROUTINE_GROUP_OPTIONS: RoutineGroup[] = [
  "DESCANSO",
  "PECHO_BICEPS",
  "ESPALDA_TRICEPS",
  "PIERNAS_ABDOMINALES",
  "BOMBEO",
];
