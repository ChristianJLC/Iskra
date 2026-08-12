import "server-only";
import { prisma } from "@/lib/prisma";
import { MEAL_INGREDIENT_PORTIONS, type MealIngredient } from "@/lib/meal-ingredients";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizeIngredientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/\s+/g, " ");
}

function isValidPortion(value: string | null): value is MealIngredient["portion"] {
  return value === null || (MEAL_INGREDIENT_PORTIONS as readonly string[]).includes(value);
}

export async function getCachedIngredients(
  userId: string,
  names: string[]
): Promise<Map<string, MealIngredient>> {
  const keys = names.map(normalizeIngredientKey);

  const rows = await prisma.savedIngredient.findMany({
    where: { userId, key: { in: keys } },
  });

  const byKey = new Map<string, MealIngredient>();
  for (const row of rows) {
    if (!isValidPortion(row.portion)) continue;
    byKey.set(row.key, {
      name: row.name,
      calories: row.calories,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      portion: row.portion,
    });
  }

  return byKey;
}

export async function cacheIngredients(userId: string, ingredients: MealIngredient[]) {
  await Promise.all(
    ingredients.map((ingredient) => {
      const key = normalizeIngredientKey(ingredient.name);
      const data = {
        name: ingredient.name,
        calories: Math.round(ingredient.calories),
        proteinG: ingredient.proteinG,
        carbsG: ingredient.carbsG,
        fatG: ingredient.fatG,
        portion: ingredient.portion,
      };

      return prisma.savedIngredient.upsert({
        where: { userId_key: { userId, key } },
        update: data,
        create: { userId, key, ...data },
      });
    })
  );
}
