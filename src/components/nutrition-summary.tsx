"use client";

import { useTransition } from "react";
import { Check, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalorieGauge } from "@/components/ui/calorie-gauge";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar } from "@/components/ui/progress";
import { completeAllMeals } from "@/actions/meals";
import { recalculateNutritionPlan } from "@/actions/nutrition-profile";
import { cn } from "@/lib/cn";

function MacroStat({ label, consumed, target }: { label: string; consumed: number; target: number }) {
  return (
    <div className="min-w-0 space-y-2 rounded-2xl bg-surface-2 p-3">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="text-lg leading-none font-semibold tracking-tight text-foreground">
        <CountUp value={consumed} />
        <span className="block pt-1 text-xs font-normal tracking-normal text-muted">de {target} g</span>
      </p>
      <ProgressBar percent={target > 0 ? (consumed / target) * 100 : 0} className="h-1.5 bg-surface" />
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
      <Card className="space-y-4 rounded-3xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted">Calorías</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{Math.round(consumed.calories)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Proteína</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{consumed.proteinG.toFixed(0)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted">Carbohidratos</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{consumed.carbsG.toFixed(0)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted">Grasa</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{consumed.fatG.toFixed(0)} g</p>
          </div>
        </div>
        <Button
          type="button"
          variant="solid"
          className="h-12 w-full"
          disabled={isCalculating}
          onClick={() => startCalculating(() => recalculateNutritionPlan())}
        >
          {isCalculating ? "Calculando…" : "Calcular mi meta diaria"}
        </Button>
      </Card>
    );
  }

  const calories = Math.round(consumed.calories);
  const over = calories - target.calorieRangeMax;
  const left = target.calorieRangeMin - calories;

  return (
    <Card className="space-y-5 rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Calorías de hoy</h2>
        <button
          type="button"
          onClick={() => startCalculating(() => recalculateNutritionPlan())}
          disabled={isCalculating}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", isCalculating && "motion-safe:animate-spin")} />
          {isCalculating ? "Calculando…" : "Recalcular meta"}
        </button>
      </div>

      <div>
        <CalorieGauge consumed={calories} rangeMin={target.calorieRangeMin} rangeMax={target.calorieRangeMax}>
          <p
            className={cn(
              "text-5xl leading-none font-semibold tracking-tight",
              over > 0 ? "text-danger" : "text-foreground"
            )}
          >
            <CountUp value={calories} />
          </p>
          <p className="mt-1 text-sm text-muted">de {target.calories.toLocaleString("es")} kcal</p>
        </CalorieGauge>

        <p className={cn("mt-3 text-center text-sm font-medium", over > 0 ? "text-danger" : "text-foreground")}>
          {over > 0
            ? `${over.toLocaleString("es")} kcal sobre tu rango`
            : left > 0
              ? `Te faltan ${left.toLocaleString("es")} kcal para tu rango`
              : "Estás dentro de tu rango"}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted">
          <span className="size-2 rounded-full bg-accent/30" />
          Tu rango: {target.calorieRangeMin.toLocaleString("es")} a {target.calorieRangeMax.toLocaleString("es")} kcal
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MacroStat label="Proteína" consumed={consumed.proteinG} target={target.proteinG} />
        <MacroStat label="Carbos" consumed={consumed.carbsG} target={target.carbsG} />
        <MacroStat label="Grasa" consumed={consumed.fatG} target={target.fatG} />
      </div>

      <div className="space-y-1.5">
        <Button
          type="button"
          variant={allCompleted ? "secondary" : "solid"}
          className="h-12 w-full"
          disabled={!hasMeals || isFinishing}
          whileHover={hasMeals && !isFinishing ? { y: -2 } : undefined}
          onClick={() => startFinishing(() => completeAllMeals())}
        >
          {isFinishing ? (
            "Guardando…"
          ) : allCompleted ? (
            <>
              <Check className="size-4" />
              Día completado
            </>
          ) : (
            "Terminar día"
          )}
        </Button>
        {!hasMeals && <p className="text-center text-xs text-muted">Registra al menos una comida para terminar el día.</p>}
      </div>
    </Card>
  );
}
