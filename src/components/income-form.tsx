"use client";

import { useState, useTransition } from "react";
import { setBiweeklyIncome } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export function IncomeForm({
  month,
  year,
  biweeklyIncome,
}: {
  month: number;
  year: number;
  biweeklyIncome: number;
}) {
  const [isEditing, setIsEditing] = useState(!biweeklyIncome);
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Ingreso fijo quincenal</p>
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
            await setBiweeklyIncome(formData);
            setIsEditing(false);
          });
        }}
        className="space-y-4"
      >
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <div>
          <Label htmlFor="biweeklyIncome">Ingreso fijo quincenal</Label>
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
            Guardar ingreso quincenal
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
