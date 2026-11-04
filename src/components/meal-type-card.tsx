"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Apple, Check, Coffee, Moon, Plus, Sun, X, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { AddMealForm } from "@/components/add-meal-form";
import { deleteMeal } from "@/actions/meals";
import { parseStoredIngredients, PORTION_LABELS } from "@/lib/meal-ingredients";
import { cn } from "@/lib/cn";
import type { SavedMealSummary } from "@/components/saved-meal-picker";

type MealType = "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK";

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  DESAYUNO: Coffee,
  ALMUERZO: Sun,
  CENA: Moon,
  SNACK: Apple,
};

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
  const Icon = MEAL_ICONS[type];
  const hasMeals = meals.length > 0;

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
    <Card className="space-y-3 rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
            hasMeals ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
          )}
        >
          <Icon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{label}</h2>
          {hasMeals ? (
            <p className="truncate text-xs text-muted tabular-nums">
              <span className="font-medium text-foreground">{Math.round(totals.calories)} kcal</span>
              {" · "}P {Math.round(totals.proteinG)} · C {Math.round(totals.carbsG)} · G {Math.round(totals.fatG)}
            </p>
          ) : (
            <p className="text-xs text-muted">Sin registrar</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          aria-expanded={showForm}
          aria-label={showForm ? `Cerrar formulario de ${label}` : `Agregar comida a ${label}`}
          className={cn(
            "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
            showForm
              ? "text-muted hover:bg-surface-hover hover:text-foreground"
              : "bg-surface-2 text-foreground hover:bg-surface-hover"
          )}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cerrar" : "Agregar"}
        </button>
      </div>

      {hasMeals && (
        <ul className="divide-y divide-border/70">
          {meals.map((meal) => {
            const ingredients = parseStoredIngredients(meal.ingredients);
            return (
              <li key={meal.id} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {meal.completed && <Check className="size-3.5 shrink-0 text-accent" strokeWidth={3} />}
                    <span className="truncate">{meal.description}</span>
                  </p>
                  {ingredients.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {ingredients
                        .map((i) => (i.portion ? `${i.name} (${PORTION_LABELS[i.portion]})` : i.name))
                        .join(", ")}
                    </p>
                  )}
                  {meal.notes && <p className="mt-0.5 text-xs text-muted">{meal.notes}</p>}
                </div>
                {meal.calories != null && (
                  <p className="shrink-0 pt-0.5 text-xs font-medium text-muted tabular-nums">{meal.calories} kcal</p>
                )}
                <DeleteButton action={deleteMeal.bind(null, meal.id)} />
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-surface-2 p-3 sm:p-4">
              <AddMealForm
                type={type}
                remainingPhotos={remainingPhotos}
                savedMeals={savedMeals}
                onDone={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
