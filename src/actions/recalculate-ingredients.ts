"use server";

import * as z from "zod";
import { verifySession } from "@/lib/dal";
import { recalculateNutritionFromIngredients, type IngredientRecalculationResult } from "@/lib/nutrition-ai";
import { getCachedIngredients, cacheIngredients, normalizeIngredientKey } from "@/lib/ingredient-cache";

const IngredientNamesSchema = z.array(z.string().trim().min(1).max(80)).min(1).max(30);

export async function recalculateIngredients(names: string[]): Promise<IngredientRecalculationResult> {
  const { userId } = await verifySession();

  const parsed = IngredientNamesSchema.safeParse(names);
  if (!parsed.success) {
    return { ok: false, error: "Lista de ingredientes inválida." };
  }

  const cached = await getCachedIngredients(userId, parsed.data);
  const uncachedNames = parsed.data.filter((name) => !cached.has(normalizeIngredientKey(name)));

  if (uncachedNames.length === 0) {
    return {
      ok: true,
      data: { ingredients: parsed.data.map((name) => cached.get(normalizeIngredientKey(name))!) },
    };
  }

  const result = await recalculateNutritionFromIngredients(uncachedNames);
  if (!result.ok) {
    return result;
  }

  await cacheIngredients(userId, result.data.ingredients);

  const freshByKey = new Map(
    result.data.ingredients.map((ingredient, i) => [normalizeIngredientKey(uncachedNames[i]), ingredient])
  );

  return {
    ok: true,
    data: {
      ingredients: parsed.data.map((name) => {
        const key = normalizeIngredientKey(name);
        return cached.get(key) ?? freshByKey.get(key)!;
      }),
    },
  };
}
