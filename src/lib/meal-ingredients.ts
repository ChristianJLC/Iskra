import * as z from "zod";

export const MEAL_INGREDIENT_PORTIONS = ["PEQUENO", "MEDIANO", "GRANDE"] as const;

export const MealIngredientSchema = z.object({
  name: z.string().trim().min(1).max(80),
  calories: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(500),
  portion: z.enum(MEAL_INGREDIENT_PORTIONS).nullable(),
});

export const MealIngredientsArraySchema = z.array(MealIngredientSchema).max(30);

export type MealIngredient = z.infer<typeof MealIngredientSchema>;

export const PORTION_LABELS: Record<(typeof MEAL_INGREDIENT_PORTIONS)[number], string> = {
  PEQUENO: "Pequeño",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
};

export function sumIngredientMacros(ingredients: MealIngredient[]) {
  return ingredients.reduce(
    (acc, ingredient) => ({
      calories: acc.calories + ingredient.calories,
      proteinG: acc.proteinG + ingredient.proteinG,
      carbsG: acc.carbsG + ingredient.carbsG,
      fatG: acc.fatG + ingredient.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

export function parseStoredIngredients(value: unknown): MealIngredient[] {
  const result = MealIngredientsArraySchema.safeParse(value);
  return result.success ? result.data : [];
}
