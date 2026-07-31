"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function addExercise(formData: FormData) {
  const { userId } = await verifySession();

  const activity = (formData.get("activity") as string)?.trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const notes = (formData.get("notes") as string)?.trim();

  if (!activity || !durationMinutes || durationMinutes <= 0) return;

  await prisma.exerciseEntry.create({
    data: { userId, activity, durationMinutes, notes: notes || null },
  });

  revalidatePath("/ejercicio");
  revalidatePath("/");
}

export async function toggleExercise(id: string, completed: boolean) {
  const { userId } = await verifySession();

  await prisma.exerciseEntry.updateMany({
    where: { id, userId },
    data: { completed },
  });

  revalidatePath("/ejercicio");
  revalidatePath("/");
}

export async function deleteExercise(id: string) {
  const { userId } = await verifySession();

  await prisma.exerciseEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/ejercicio");
  revalidatePath("/");
}
