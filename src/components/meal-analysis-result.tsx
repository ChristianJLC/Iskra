"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Utensils, X } from "lucide-react";
import { recalculateIngredients } from "@/actions/recalculate-ingredients";
import { sumIngredientMacros, type MealIngredient } from "@/lib/meal-ingredients";
import { Card } from "@/components/ui/card";
import { Input, Textarea, FieldError } from "@/components/ui/input";
import { cn } from "@/lib/cn";

function TotalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function MealAnalysisResult({
  description,
  onDescriptionChange,
  ingredients,
  onIngredientsChange,
}: {
  description: string;
  onDescriptionChange: (value: string) => void;
  ingredients: MealIngredient[];
  onIngredientsChange: (next: MealIngredient[]) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, startCalculating] = useTransition();

  const totals = sumIngredientMacros(ingredients);

  function removeIngredient(index: number) {
    onIngredientsChange(ingredients.filter((_, i) => i !== index));
  }

  function addIngredients() {
    const lines = draft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setError(null);
    startCalculating(async () => {
      const result = await recalculateIngredients(lines);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onIngredientsChange([...ingredients, ...result.data.ingredients]);
      setDraft("");
      setIsAdding(false);
    });
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <Input
            autoFocus
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
            className="text-base font-bold"
          />
        ) : (
          <>
            <p className="flex-1 truncate text-base font-bold text-foreground">{description}</p>
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              aria-label="Cambiar nombre"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl bg-surface-2 py-3">
        <TotalStat label="Kcal" value={String(Math.round(totals.calories))} />
        <TotalStat label="Proteína" value={`${Math.round(totals.proteinG)} g`} />
        <TotalStat label="Carb" value={`${Math.round(totals.carbsG)} g`} />
        <TotalStat label="Grasa" value={`${Math.round(totals.fatG)} g`} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Qué hay en tu comida</p>
          <p className="text-xs text-muted">Basado en 1 porción</p>
        </div>

        {ingredients.length > 0 && (
          <ul className="space-y-2">
            {ingredients.map((ingredient, i) => (
              <li key={`${ingredient.name}-${i}`} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white">
                  <Utensils className="size-4" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">{ingredient.name}</p>
                <p className="shrink-0 text-xs text-muted">{Math.round(ingredient.calories)} kcal</p>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  aria-label={`Eliminar ${ingredient.name}`}
                  className="shrink-0 text-muted transition-colors hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {isAdding ? (
          <div className="space-y-2">
            <Textarea
              rows={2}
              autoFocus
              placeholder={"Un ingrediente por línea, ej:\n2 huevos"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isCalculating}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addIngredients}
                disabled={isCalculating || !draft.trim()}
                className={cn(
                  "flex-1 rounded-xl bg-gradient-to-br from-accent to-accent-2 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
                  (isCalculating || !draft.trim()) && "cursor-not-allowed opacity-50"
                )}
              >
                {isCalculating ? "Calculando…" : "Agregar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setDraft("");
                  setError(null);
                }}
                disabled={isCalculating}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
            <FieldError messages={error ? [error] : undefined} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-accent"
          >
            <Plus className="size-4" />
            Agregar Ingrediente
          </button>
        )}
      </div>
    </Card>
  );
}
