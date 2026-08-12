import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { NutritionOnboarding } from "@/components/nutrition-onboarding";
import { NutritionSummary } from "@/components/nutrition-summary";
import { MealTypeCard } from "@/components/meal-type-card";
import { WaterCard } from "@/components/water-card";
import { DAILY_PHOTO_LIMIT } from "@/lib/meal-photo";
import { getTodayGlasses } from "@/lib/water";
import { parseStoredIngredients } from "@/lib/meal-ingredients";

const MEAL_TYPES = ["DESAYUNO", "ALMUERZO", "CENA", "SNACK"] as const;

const MEAL_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
  SNACK: "Snack",
};

export default async function ComidasPage() {
  const { userId } = await verifySession();

  const nutritionProfile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!nutritionProfile?.completedAt) {
    return <NutritionOnboarding />;
  }

  const [meals, photosUsedToday, waterGlasses, savedMealsRaw] = await Promise.all([
    prisma.mealEntry.findMany({
      where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mealPhotoAnalysis.count({
      where: { userId, createdAt: { gte: startOfToday(), lt: endOfToday() } },
    }),
    getTodayGlasses(userId),
    prisma.savedMeal.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nutrición</h1>
          <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
        </div>
        <Link
          href="/comidas/alimentos"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          Mis alimentos
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <NutritionSummary
        consumed={totals}
        target={target}
        hasMeals={meals.length > 0}
        allCompleted={meals.length > 0 && meals.every((m) => m.completed)}
      />

      <div className="space-y-4">
        {MEAL_TYPES.map((type) => (
          <MealTypeCard
            key={type}
            type={type}
            label={MEAL_LABELS[type]}
            meals={meals.filter((meal) => meal.type === type)}
            remainingPhotos={Math.max(0, DAILY_PHOTO_LIMIT - photosUsedToday)}
            savedMeals={savedMeals}
          />
        ))}

        <WaterCard glasses={waterGlasses} />
      </div>
    </div>
  );
}
