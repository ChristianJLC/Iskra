import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { addMeal, toggleMeal, deleteMeal } from "@/actions/meals";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Comidas</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <Card>
        <form action={addMeal} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="DESAYUNO">Desayuno</option>
              <option value="ALMUERZO">Almuerzo</option>
              <option value="CENA">Cena</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">¿Qué vas a comer?</Label>
            <Input id="description" name="description" placeholder="Ej. Avena con fruta" required />
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Calorías, ingredientes, etc." />
          </div>

          <SubmitButton>Agregar comida</SubmitButton>
        </form>
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
            </div>
            <DeleteButton action={deleteMeal.bind(null, meal.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
