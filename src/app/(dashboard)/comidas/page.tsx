import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { toggleMeal, deleteMeal } from "@/actions/meals";
import { Card } from "@/components/ui/card";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";
import { AddMealForm } from "@/components/add-meal-form";

const MEAL_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
};

export default async function ComidasPage() {
  const { userId } = await verifySession();

  const meals = await prisma.mealEntry.findMany({
    where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
    orderBy: { createdAt: "asc" },
  });

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories ?? 0),
      proteinG: acc.proteinG + (meal.proteinG ?? 0),
      carbsG: acc.carbsG + (meal.carbsG ?? 0),
      fatG: acc.fatG + (meal.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Comidas</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <Card className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Calorías</p>
          <p className="text-lg font-semibold text-foreground">{Math.round(totals.calories)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Proteína</p>
          <p className="text-lg font-semibold text-foreground">{totals.proteinG.toFixed(0)} g</p>
        </div>
        <div>
          <p className="text-xs text-muted">Carbohidratos</p>
          <p className="text-lg font-semibold text-foreground">{totals.carbsG.toFixed(0)} g</p>
        </div>
        <div>
          <p className="text-xs text-muted">Grasa</p>
          <p className="text-lg font-semibold text-foreground">{totals.fatG.toFixed(0)} g</p>
        </div>
      </Card>

      <Card>
        <AddMealForm />
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
