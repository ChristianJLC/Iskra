"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { MealIngredient } from "@/lib/meal-ingredients";

export type SavedMealSummary = {
  id: string;
  title: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: MealIngredient[];
};

export function SavedMealPicker({
  savedMeals,
  onSelect,
}: {
  savedMeals: SavedMealSummary[];
  onSelect: (meal: SavedMealSummary) => void;
}) {
  const [open, setOpen] = useState(false);

  if (savedMeals.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        Usar una comida guardada
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl shadow-soft"
          >
            {savedMeals.map((meal) => (
              <li key={meal.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(meal);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  <span className="text-foreground">{meal.title}</span>
                  {meal.calories != null && <span className="text-xs text-muted">{meal.calories} kcal</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
