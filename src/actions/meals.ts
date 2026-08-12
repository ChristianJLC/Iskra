"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday } from "@/lib/date";
import { MealIngredientsArraySchema, sumIngredientMacros, type MealIngredient } from "@/lib/meal-ingredients";
import type { Prisma } from "@/generated/prisma/client";

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIngredients(value: FormDataEntryValue | null): MealIngredient[] {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const result = MealIngredientsArraySchema.safeParse(JSON.parse(value));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export async function addMeal(formData: FormData) {
  const { userId } = await verifySession();

  const type = formData.get("type") as string;
  const description = (formData.get("description") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();
  const ingredients = parseIngredients(formData.get("ingredients"));

  const manualCalories = parseOptionalNumber(formData.get("calories"));
  const manualProteinG = parseOptionalNumber(formData.get("proteinG"));
  const manualCarbsG = parseOptionalNumber(formData.get("carbsG"));
  const manualFatG = parseOptionalNumber(formData.get("fatG"));

  if (!type || !description) return;

  const hasIngredients = ingredients.length > 0;
  const totals = hasIngredients ? sumIngredientMacros(ingredients) : null;

  const calories = hasIngredients ? Math.round(totals!.calories) : manualCalories;
  const proteinG = hasIngredients ? totals!.proteinG : manualProteinG;
  const carbsG = hasIngredients ? totals!.carbsG : manualCarbsG;
  const fatG = hasIngredients ? totals!.fatG : manualFatG;

  const ingredientsJson = hasIngredients ? (ingredients as unknown as Prisma.InputJsonValue) : undefined;

  await prisma.mealEntry.create({
    data: {
      userId,
      type: type as "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK",
      description,
      notes: notes || null,
      calories,
      proteinG,
      carbsG,
      fatG,
      ingredients: ingredientsJson,
    },
  });

  await prisma.savedMeal.upsert({
    where: { userId_title: { userId, title: description } },
    update: { calories, proteinG, carbsG, fatG, ingredients: ingredientsJson },
    create: { userId, title: description, calories, proteinG, carbsG, fatG, ingredients: ingredientsJson },
  });

  revalidatePath("/comidas");
  revalidatePath("/comidas/alimentos");
  revalidatePath("/");
}

export async function deleteMeal(id: string) {
  const { userId } = await verifySession();

  await prisma.mealEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/comidas");
  revalidatePath("/");
}

export async function completeAllMeals() {
  const { userId } = await verifySession();

  await prisma.mealEntry.updateMany({
    where: { userId, date: { gte: startOfToday(), lt: endOfToday() }, completed: false },
    data: { completed: true },
  });

  revalidatePath("/comidas");
  revalidatePath("/");
}
