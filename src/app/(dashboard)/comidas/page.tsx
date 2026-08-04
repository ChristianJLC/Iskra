import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { toggleMeal, deleteMeal } from "@/actions/meals";
import { Card } from "@/components/ui/card";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";
import { AddMealForm } from "@/components/add-meal-form";
import { NutritionOnboarding } from "@/components/nutrition-onboarding";
import { NutritionSummary } from "@/components/nutrition-summary";
import { DAILY_PHOTO_LIMIT } from "@/lib/meal-photo";

const MEAL_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
};

export default async function ComidasPage() {
  const { userId } = await verifySession();

  const nutritionProfile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!nutritionProfile?.completedAt) {
    return <NutritionOnboarding />;
  }

  const [meals, photosUsedToday] = await Promise.all([
    prisma.mealEntry.findMany({
      where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mealPhotoAnalysis.count({
      where: { userId, createdAt: { gte: startOfToday(), lt: endOfToday() } },
    }),
  ]);

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories ?? 0),
      proteinG: acc.proteinG + (meal.proteinG ?? 0),
      carbsG: acc.carbsG + (meal.carbsG ?? 0),
      fatG: acc.fatG + (meal.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const target =
    nutritionProfile.targetCalories != null &&
    nutritionProfile.targetCalorieMin != null &&
    nutritionProfile.targetCalorieMax != null &&
    nutritionProfile.targetProteinG != null &&
    nutritionProfile.targetCarbsG != null &&
    nutritionProfile.targetFatG != null
      ? {
          calories: nutritionProfile.targetCalories,
          calorieRangeMin: nutritionProfile.targetCalorieMin,
          calorieRangeMax: nutritionProfile.targetCalorieMax,
          proteinG: nutritionProfile.targetProteinG,
          carbsG: nutritionProfile.targetCarbsG,
          fatG: nutritionProfile.targetFatG,
        }
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Nutrición</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <NutritionSummary
        consumed={totals}
        target={target}
        hasMeals={meals.length > 0}
        allCompleted={meals.length > 0 && meals.every((m) => m.completed)}
      />

      <Card>
        <AddMealForm remainingPhotos={Math.max(0, DAILY_PHOTO_LIMIT - photosUsedToday)} />
      </Card>

      <div className="space-y-3">
        {meals.length === 0 && (
          <p className="text-sm text-muted">Aún no has registrado comidas hoy.</p>
        )}

        {meals.map((meal) => (
          <Card key={meal.id} className="flex items-start gap-3 py-4">
            <ToggleCheckbox
              checked={meal.completed}
              action={toggleMeal.bind(null, meal.id, !meal.completed)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {MEAL_LABELS[meal.type]}
              </p>
              <p
                className={
                  meal.completed
                    ? "text-sm text-muted line-through"
                    : "text-sm text-foreground"
                }
              >
                {meal.description}
              </p>
              {meal.notes && <p className="mt-0.5 text-xs text-muted">{meal.notes}</p>}
              {meal.calories != null && (
                <p className="mt-0.5 text-xs text-muted">{meal.calories} kcal</p>
              )}
            </div>
            <DeleteButton action={deleteMeal.bind(null, meal.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
