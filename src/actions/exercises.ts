"use server";

import { revalidatePath } from "next/cache";
import { verifySession, getUserTimezone } from "@/lib/dal";
import {
  saveWorkoutSchedule as saveWorkoutScheduleForUser,
  markWorkoutDone as markWorkoutDoneForUser,
  unmarkWorkoutDone as unmarkWorkoutDoneForUser,
  type EditableDay,
} from "@/lib/exercise";
import type { MuscleGroup } from "@/generated/prisma/client";

export async function saveWorkoutSchedule(days: Record<EditableDay, MuscleGroup[]>) {
  const { userId } = await verifySession();
  await saveWorkoutScheduleForUser(userId, days);
  revalidatePath("/ejercicio");
  revalidatePath("/");
}

export async function markWorkoutDone(year: number, month: number, day: number) {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const changed = await markWorkoutDoneForUser(userId, timezone, { year, month, day });
  if (!changed) return;

  revalidatePath("/ejercicio");
  revalidatePath("/ejercicio/historial");
  revalidatePath("/");
}

export async function unmarkWorkoutDone(year: number, month: number, day: number) {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  await unmarkWorkoutDoneForUser(userId, timezone, { year, month, day });

  revalidatePath("/ejercicio");
  revalidatePath("/ejercicio/historial");
  revalidatePath("/");
}
