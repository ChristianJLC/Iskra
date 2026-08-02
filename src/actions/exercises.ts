"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getScheduledGroup } from "@/lib/exercise";
import { ROUTINE_GROUP_OPTIONS } from "@/lib/routine-groups";
import type { RoutineGroup } from "@/generated/prisma/client";

const EDITABLE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function readGroup(formData: FormData, field: string): RoutineGroup {
  const value = formData.get(field) as string;
  return ROUTINE_GROUP_OPTIONS.includes(value as RoutineGroup) ? (value as RoutineGroup) : "DESCANSO";
}

export async function saveWorkoutSchedule(formData: FormData) {
  const { userId } = await verifySession();

  const days = Object.fromEntries(EDITABLE_DAYS.map((day) => [day, readGroup(formData, day)])) as Record<
    (typeof EDITABLE_DAYS)[number],
    RoutineGroup
  >;

  await prisma.workoutSchedule.upsert({
    where: { userId },
    update: { ...days, sunday: "DESCANSO" },
    create: { userId, ...days, sunday: "DESCANSO" },
  });

  revalidatePath("/ejercicio");
}

export async function markWorkoutDone(year: number, month: number, day: number) {
  const { userId } = await verifySession();

  const date = new Date(year, month - 1, day);
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const group = getScheduledGroup(schedule, date);
  if (group === "DESCANSO") return;

  const exists = await prisma.workoutCompletion.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (exists) return;

  await prisma.workoutCompletion.create({ data: { userId, date, group } });

  revalidatePath("/ejercicio");
  revalidatePath("/ejercicio/historial");
  revalidatePath("/");
}

export async function unmarkWorkoutDone(year: number, month: number, day: number) {
  const { userId } = await verifySession();

  const date = new Date(year, month - 1, day);
  await prisma.workoutCompletion.deleteMany({ where: { userId, date } });

  revalidatePath("/ejercicio");
  revalidatePath("/ejercicio/historial");
  revalidatePath("/");
}
