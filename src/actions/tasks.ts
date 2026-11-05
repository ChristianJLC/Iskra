"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { TASK_CATEGORY_OPTIONS } from "@/lib/task-summary";

function revalidateTasks() {
  revalidatePath("/organizacion");
  revalidatePath("/estudio");
  revalidatePath("/");
}

function parseTaskFields(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const dueDateRaw = formData.get("dueDate") as string;
  const priorityRaw = formData.get("priority") as string;
  const categoryRaw = formData.get("category") as string;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  if (!title) return null;
  if (dueDate && Number.isNaN(dueDate.getTime())) return null;

  return {
    title,
    description: description || null,
    dueDate,
    priority: (["BAJA", "MEDIA", "ALTA"].includes(priorityRaw) ? priorityRaw : "MEDIA") as "BAJA" | "MEDIA" | "ALTA",
    category: TASK_CATEGORY_OPTIONS.find(({ value }) => value === categoryRaw)?.value ?? null,
  };
}

export async function addTask(formData: FormData) {
  const { userId } = await verifySession();

  const fields = parseTaskFields(formData);
  if (!fields) return;

  await prisma.task.create({ data: { userId, ...fields } });

  revalidateTasks();
}

export async function updateTask(id: string, formData: FormData) {
  const { userId } = await verifySession();

  const fields = parseTaskFields(formData);
  if (!fields) return;

  await prisma.task.updateMany({ where: { id, userId }, data: fields });

  revalidateTasks();
}

export async function toggleTask(id: string, completed: boolean) {
  const { userId } = await verifySession();

  await prisma.task.updateMany({
    where: { id, userId },
    data: { completed },
  });

  revalidateTasks();
}

export async function deleteTask(id: string) {
  const { userId } = await verifySession();

  await prisma.task.deleteMany({ where: { id, userId } });

  revalidateTasks();
}
