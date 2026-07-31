"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { nextRecurrenceDate } from "@/lib/date";

export async function addTask(formData: FormData) {
  const { userId } = await verifySession();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const dueDateRaw = formData.get("dueDate") as string;
  const priority = (formData.get("priority") as string) || "MEDIA";
  const recurrence = (formData.get("recurrence") as string) || "NINGUNA";

  if (!title) return;

  await prisma.task.create({
    data: {
      userId,
      title,
      description: description || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      priority: priority as "BAJA" | "MEDIA" | "ALTA",
      recurrence: recurrence as "NINGUNA" | "DIARIA" | "SEMANAL" | "MENSUAL",
    },
  });

  revalidatePath("/organizacion");
  revalidatePath("/");
}

export async function toggleTask(id: string, completed: boolean) {
  const { userId } = await verifySession();

  await prisma.task.updateMany({
    where: { id, userId },
    data: { completed },
  });

  revalidatePath("/organizacion");
  revalidatePath("/");
}

export async function completeRecurringTask(id: string) {
  const { userId } = await verifySession();

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task || task.recurrence === "NINGUNA") return;

  await prisma.task.update({
    where: { id },
    data: { dueDate: nextRecurrenceDate(task.dueDate, task.recurrence) },
  });

  revalidatePath("/organizacion");
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  const { userId } = await verifySession();

  await prisma.task.deleteMany({ where: { id, userId } });

  revalidatePath("/organizacion");
  revalidatePath("/");
}
