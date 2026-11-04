import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { NutritionOnboarding } from "@/components/nutrition-onboarding";
import { NutritionSummary } from "@/components/nutrition-summary";
import { MealTypeCard } from "@/components/meal-type-card";
import { WaterCard } from "@/components/water-card";
import { DAILY_PHOTO_LIMIT } from "@/lib/meal-photo";
import { getTodayGlasses } from "@/lib/water";
import { parseStoredIngredients } from "@/lib/meal-ingredients";
import { getNutritionStreak } from "@/lib/nutrition";
import { StreakCard } from "@/components/streak-card";

const MEAL_TYPES = ["DESAYUNO", "ALMUERZO", "CENA", "SNACK"] as const;

const MEAL_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
  SNACK: "Snack",
};

export default async function ComidasPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const nutritionProfile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!nutritionProfile?.completedAt) {
    return <NutritionOnboarding />;
  }

  const [meals, photosUsedToday, waterGlasses, savedMealsRaw, streak] = await Promise.all([
    prisma.mealEntry.findMany({
      where: { userId, date: { gte: startOfToday(timezone), lt: endOfToday(timezone) } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mealPhotoAnalysis.count({
      where: { userId, createdAt: { gte: startOfToday(timezone), lt: endOfToday(timezone) } },
    }),
    getTodayGlasses(userId, timezone),
    prisma.savedMeal.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    getNutritionStreak(userId, timezone),
  ]);

  const savedMeals = savedMealsRaw.map((meal) => ({
    id: meal.id,
    title: meal.title,
    calories: meal.calories,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
    ingredients: parseStoredIngredients(meal.ingredients),
  }));

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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="reveal flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nutrición</h1>
          <p className="text-sm text-muted">{formatDateEs(new Date(), timezone)}</p>
        </div>
        <Link
          href="/comidas/alimentos"
          className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-surface-2 pr-2.5 pl-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Mis alimentos
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="reveal [--i:1] lg:col-start-1">
          <NutritionSummary
            consumed={totals}
            target={target}
            hasMeals={meals.length > 0}
            allCompleted={meals.length > 0 && meals.every((m) => m.completed)}
          />
        </div>

        <div className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {MEAL_TYPES.map((type, index) => (
            <div key={type} className="reveal" style={{ "--i": index + 2 } as React.CSSProperties}>
              <MealTypeCard
                type={type}
                label={MEAL_LABELS[type]}
                meals={meals.filter((meal) => meal.type === type)}
                remainingPhotos={Math.max(0, DAILY_PHOTO_LIMIT - photosUsedToday)}
                savedMeals={savedMeals}
              />
            </div>
          ))}
        </div>

        <div className="reveal space-y-4 [--i:6] lg:col-start-1">
          <WaterCard glasses={waterGlasses} />
          <StreakCard streak={streak} emptyLabel="Empieza tu racha nutricional hoy" />
        </div>
      </div>
    </div>
  );
}
