"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function CalorieProgress({
  consumed,
  target,
  min,
  max,
}: {
  consumed: number;
  target: number;
  min: number;
  max: number;
}) {
  const revealed = useRevealed();
  const percent = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;

  return (
    <div className="space-y-2">
      <p className="text-2xl font-semibold text-foreground">
        {Math.round(consumed).toLocaleString("es")}
        <span className="text-base font-normal text-muted"> / {target.toLocaleString("es")} kcal</span>
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: revealed ? `${percent}%` : "0%" }}
        />
      </div>
      <p className="text-xs text-muted">
        Rango recomendado: {min.toLocaleString("es")}–{max.toLocaleString("es")} kcal
      </p>
    </div>
  );
}

function MacroProgress({ label, consumed, target }: { label: string; consumed: number; target: number }) {
  const revealed = useRevealed();
  const percent = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;

  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {Math.round(consumed)} / {target} g
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
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

  if (!target) {
    return (
      <Card className="space-y-4">
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
          className="w-full"
          disabled={isCalculating}
          onClick={() => startCalculating(() => recalculateNutritionPlan())}
        >
          {isCalculating ? "Calculando…" : "Calcular mi meta diaria"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <CalorieProgress
        consumed={consumed.calories}
        target={target.calories}
        min={target.calorieRangeMin}
        max={target.calorieRangeMax}
      />

      <div className="flex gap-4 pt-1">
        <MacroProgress label="Proteínas" consumed={consumed.proteinG} target={target.proteinG} />
        <MacroProgress label="Carbs" consumed={consumed.carbsG} target={target.carbsG} />
        <MacroProgress label="Grasas" consumed={consumed.fatG} target={target.fatG} />
      </div>

      <Button
        type="button"
        variant={allCompleted ? "secondary" : "primary"}
        className={cn("w-full", hasMeals && !allCompleted && !isFinishing && "animate-pulse-glow")}
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
