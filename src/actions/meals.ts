"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function addMeal(formData: FormData) {
  const { userId } = await verifySession();

  const type = formData.get("type") as string;
  const description = (formData.get("description") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();
  const calories = parseOptionalNumber(formData.get("calories"));
  const proteinG = parseOptionalNumber(formData.get("proteinG"));
  const carbsG = parseOptionalNumber(formData.get("carbsG"));
  const fatG = parseOptionalNumber(formData.get("fatG"));

  if (!type || !description) return;

  await prisma.mealEntry.create({
    data: {
      userId,
      type: type as "DESAYUNO" | "ALMUERZO" | "CENA",
      description,
      notes: notes || null,
      calories: calories !== null ? Math.round(calories) : null,
      proteinG,
      carbsG,
      fatG,
    },
  });

  revalidatePath("/comidas");
  revalidatePath("/");
}

export async function toggleMeal(id: string, completed: boolean) {
  const { userId } = await verifySession();

  await prisma.mealEntry.updateMany({
    where: { id, userId },
    data: { completed },
  });

  revalidatePath("/comidas");
  revalidatePath("/");
}

export async function deleteMeal(id: string) {
  const { userId } = await verifySession();

  await prisma.mealEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/comidas");
  revalidatePath("/");
}
