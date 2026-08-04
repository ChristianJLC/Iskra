"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getScheduledGroups } from "@/lib/exercise";
import { MUSCLE_GROUP_OPTIONS } from "@/lib/routine-groups";
import type { MuscleGroup } from "@/generated/prisma/client";

const EDITABLE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

type EditableDay = (typeof EDITABLE_DAYS)[number];

function sanitizeGroups(groups: MuscleGroup[]): MuscleGroup[] {
  return groups.filter((group) => MUSCLE_GROUP_OPTIONS.includes(group));
}

export async function saveWorkoutSchedule(days: Record<EditableDay, MuscleGroup[]>) {
  const { userId } = await verifySession();

  const data = Object.fromEntries(
    EDITABLE_DAYS.map((day) => [day, sanitizeGroups(days[day] ?? [])])
  ) as Record<EditableDay, MuscleGroup[]>;

  await prisma.workoutSchedule.upsert({
    where: { userId },
    update: { ...data, sunday: [] },
    create: { userId, ...data, sunday: [] },
  });

  revalidatePath("/ejercicio");
}

export async function markWorkoutDone(year: number, month: number, day: number) {
  const { userId } = await verifySession();

  const date = new Date(year, month - 1, day);
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const groups = getScheduledGroups(schedule, date);
  if (groups.length === 0) return;

  const exists = await prisma.workoutCompletion.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (exists) return;

  await prisma.workoutCompletion.create({ data: { userId, date, groups } });

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
