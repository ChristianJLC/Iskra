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
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
];

const FREQUENCY_LABEL: Record<IncomeFrequency, string> = {
  QUINCENAL: "Ingreso fijo quincenal",
  MENSUAL: "Ingreso fijo mensual",
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

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">{FREQUENCY_LABEL[incomeFrequency]}</p>
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
          <Label>Frecuencia</Label>
          <SegmentedControl
            layoutId="income-frequency-indicator"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={setFrequency}
          />
        </div>
        <div>
          <Label htmlFor="biweeklyIncome">{FREQUENCY_LABEL[frequency]}</Label>
          <Input
            id="biweeklyIncome"
            name="biweeklyIncome"
            type="number"
            min={0}
            step="0.01"
            defaultValue={biweeklyIncome || undefined}
            placeholder="0.00"
            required
          />
        </div>
        <div className="flex gap-2">
          <SubmitButton disabled={isPending} variant="secondary">
            Guardar ingreso
          </SubmitButton>
          {Boolean(biweeklyIncome) && (
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
