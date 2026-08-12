"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalorieRangeArc } from "@/components/ui/calorie-range-arc";
import { completeAllMeals } from "@/actions/meals";
import { recalculateNutritionPlan } from "@/actions/nutrition-profile";
import { cn } from "@/lib/cn";

function useRevealed(delay = 50) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return revealed;
}

function MacroProgress({ label, consumed, target }: { label: string; consumed: number; target: number }) {
  const revealed = useRevealed();
  const percent = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;

  return (
    <div className="flex-1 space-y-1.5 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {Math.round(consumed)} / {target} g
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-700 ease-out"
          style={{ width: revealed ? `${percent}%` : "0%" }}
        />
      </div>
    </div>
  );
}

type Consumed = { calories: number; proteinG: number; carbsG: number; fatG: number };
type Target = {
  calories: number;
  calorieRangeMin: number;
  calorieRangeMax: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function NutritionSummary({
  consumed,
  target,
  hasMeals,
  allCompleted,
}: {
  consumed: Consumed;
  target: Target | null;
  hasMeals: boolean;
  allCompleted: boolean;
}) {
  const [isCalculating, startCalculating] = useTransition();
  const [isFinishing, startFinishing] = useTransition();
  const revealed = useRevealed();

  if (!target) {
    return (
      <Card className="space-y-4 rounded-[2rem]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Calorías</p>
            <p className="text-lg font-semibold text-foreground">{Math.round(consumed.calories)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Proteína</p>
            <p className="text-lg font-semibold text-foreground">{consumed.proteinG.toFixed(0)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted">Carbohidratos</p>
            <p className="text-lg font-semibold text-foreground">{consumed.carbsG.toFixed(0)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted">Grasa</p>
            <p className="text-lg font-semibold text-foreground">{consumed.fatG.toFixed(0)} g</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-full"
          disabled={isCalculating}
          onClick={() => startCalculating(() => recalculateNutritionPlan())}
        >
          {isCalculating ? "Calculando…" : "Calcular mi meta diaria"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => startCalculating(() => recalculateNutritionPlan())}
          disabled={isCalculating}
          aria-label="Recalcular meta diaria"
          className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
        >
          <Pencil className="size-4" />
        </button>
        <div className="size-9" />
      </div>

      <div className="text-center">
        <p className="text-3xl font-bold text-foreground">
          {Math.round(consumed.calories).toLocaleString("es")}
          <span className="text-muted"> / {target.calories.toLocaleString("es")}</span>
        </p>
        <p className="text-sm text-muted">kcal</p>
      </div>

      <CalorieRangeArc
        consumed={consumed.calories}
        target={target.calories}
        revealed={revealed}
        height={40}
      />

      <div className="flex gap-4 pt-1">
        <MacroProgress label="Proteínas" consumed={consumed.proteinG} target={target.proteinG} />
        <MacroProgress label="Carbs" consumed={consumed.carbsG} target={target.carbsG} />
        <MacroProgress label="Grasas" consumed={consumed.fatG} target={target.fatG} />
      </div>

      <Button
        type="button"
        variant={allCompleted ? "secondary" : "primary"}
        className={cn(
          "w-full rounded-full",
          hasMeals && !allCompleted && !isFinishing && "animate-pulse-glow"
        )}
        disabled={!hasMeals || isFinishing}
        onClick={() => startFinishing(() => completeAllMeals())}
      >
        {isFinishing ? (
          "Guardando…"
        ) : allCompleted ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check className="size-4" />
            Día completado
          </span>
        ) : (
          "Terminar día"
        )}
      </Button>
    </Card>
  );
}
