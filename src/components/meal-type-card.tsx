"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { AddMealForm } from "@/components/add-meal-form";
import { deleteMeal } from "@/actions/meals";
import { parseStoredIngredients, PORTION_LABELS } from "@/lib/meal-ingredients";
import type { SavedMealSummary } from "@/components/saved-meal-picker";

type MealType = "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK";

type MealEntry = {
  id: string;
  description: string;
  notes: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: unknown;
  completed: boolean;
};

export function MealTypeCard({
  type,
  label,
  meals,
  remainingPhotos,
  savedMeals,
}: {
  type: MealType;
  label: string;
  meals: MealEntry[];
  remainingPhotos: number;
  savedMeals: SavedMealSummary[];
}) {
  const [showForm, setShowForm] = useState(false);

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
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{label}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Flame className="size-3.5 text-accent" />
            {Math.round(totals.calories)} kcal • {Math.round(totals.proteinG)} P |{" "}
            {Math.round(totals.carbsG)} C | {Math.round(totals.fatG)} G
          </p>
        </div>
      </div>

      {meals.length > 0 && (
        <div className="space-y-2">
          {meals.map((meal) => {
            const ingredients = parseStoredIngredients(meal.ingredients);
            return (
              <div
                key={meal.id}
                className="flex items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      meal.completed
                        ? "text-sm text-muted line-through"
                        : "text-sm text-foreground"
                    }
                  >
                    {meal.description}
                  </p>
                  {ingredients.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {ingredients
                        .map((i) => (i.portion ? `${i.name} (${PORTION_LABELS[i.portion]})` : i.name))
                        .join(", ")}
                    </p>
                  )}
                  {meal.notes && <p className="mt-0.5 text-xs text-muted">{meal.notes}</p>}
                  {meal.calories != null && (
                    <p className="mt-0.5 text-xs text-muted">{meal.calories} kcal</p>
                  )}
                </div>
                <DeleteButton action={deleteMeal.bind(null, meal.id)} />
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence initial={false} mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-surface-2 p-4">
              <AddMealForm
                type={type}
                remainingPhotos={remainingPhotos}
                savedMeals={savedMeals}
                onDone={() => setShowForm(false)}
              />
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mt-3 text-xs text-muted hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            onClick={() => setShowForm(true)}
            aria-label={`Agregar comida a ${label}`}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-2 py-3 text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            <Plus className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </Card>
  );
}
