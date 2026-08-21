"use client";

import { useState, useTransition } from "react";
import { setFixedIncome } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SubmitButton } from "@/components/submit-button";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

type IncomeFrequency = "QUINCENAL" | "MENSUAL";

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: "QUINCENAL", label: "Por quincenas" },
  { value: "MENSUAL", label: "Mensual" },
];

const FREQUENCY_HELP: Record<IncomeFrequency, string> = {
  QUINCENAL: "Se reparte entre las dos quincenas según los días del mes.",
  MENSUAL: "Se registra completo el día 1 de cada mes.",
};

export function IncomeForm({
  month,
  year,
  biweeklyIncome,
  incomeFrequency,
}: {
  month: number;
  year: number;
  biweeklyIncome: number;
  incomeFrequency: IncomeFrequency;
}) {
  const [isEditing, setIsEditing] = useState(!biweeklyIncome);
  const [isPending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState<IncomeFrequency>(incomeFrequency);
  const [amountValue, setAmountValue] = useState(biweeklyIncome ? String(biweeklyIncome) : "");

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Sueldo mensual guardado</p>
          <p className="text-sm font-medium text-foreground">{currency.format(biweeklyIncome)}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) => {
          startTransition(async () => {
            await setFixedIncome(formData);
            setIsEditing(false);
          });
        }}
        className="space-y-4"
      >
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="incomeFrequency" value={frequency} />
        <div>
          <Label htmlFor="biweeklyIncome">Sueldo mensual</Label>
          <Input
            id="biweeklyIncome"
            name="biweeklyIncome"
            type="number"
            min={0}
            step="0.01"
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label>Visualizar ingreso</Label>
          <SegmentedControl
            layoutId="income-frequency-indicator"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={setFrequency}
          />
          <p className="mt-1 text-xs text-muted">{FREQUENCY_HELP[frequency]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmitButton disabled={isPending} variant="secondary">
            Guardar ingreso
          </SubmitButton>
          {Boolean(biweeklyIncome) && (
            <>
              <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-danger"
                disabled={isPending}
                onClick={() => setAmountValue("0")}
              >
                Quitar sueldo
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted">
          ¿Sin ingreso este mes (despido, pausa laboral, etc.)? &quot;Quitar sueldo&quot; pone el monto en 0 — luego dale a
          &quot;Guardar ingreso&quot; para confirmar.
        </p>
      </form>
    </Card>
  );
}
