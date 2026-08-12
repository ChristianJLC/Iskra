"use client";

import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { deleteSavedMeal } from "@/actions/saved-meals";
import { PORTION_LABELS, type MealIngredient } from "@/lib/meal-ingredients";

export type SavedMealItem = {
  id: string;
  title: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: MealIngredient[];
};

export function SavedMealList({ meals }: { meals: SavedMealItem[] }) {
  if (meals.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Todavía no guardaste ninguna comida. Cuando agregues una comida con título, aparecerá aquí para que la
          vuelvas a registrar rápido.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <Card key={meal.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{meal.title}</p>
            {meal.ingredients.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-muted">
                {meal.ingredients
                  .map((i) => (i.portion ? `${i.name} (${PORTION_LABELS[i.portion]})` : i.name))
                  .join(", ")}
              </p>
            )}
            {meal.calories != null && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                {meal.calories} kcal
                {meal.proteinG != null && ` • ${Math.round(meal.proteinG)} P`}
                {meal.carbsG != null && ` | ${Math.round(meal.carbsG)} C`}
                {meal.fatG != null && ` | ${Math.round(meal.fatG)} G`}
              </p>
            )}
          </div>
          <DeleteButton action={deleteSavedMeal.bind(null, meal.id)} />
        </Card>
      ))}
    </div>
  );
}
