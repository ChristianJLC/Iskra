"use client";

import { useState, useTransition } from "react";
import { addFinanceEntry } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

export function FinanceEntryForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isAdding) {
    return (
      <Card className="flex items-center justify-between">
        <p className="text-sm text-muted">Registra un ingreso extra o un gasto.</p>
        <Button type="button" onClick={() => setIsAdding(true)}>
          Agregar movimiento
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) => {
          startTransition(async () => {
            await addFinanceEntry(formData);
            setIsAdding(false);
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="EXTRA">Dinero Extra</option>
            <option value="GASTO">Gasto</option>
          </select>
        </div>

        <div>
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" min={0.01} step="0.01" placeholder="0.00" required />
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input id="description" name="description" placeholder="Ej. Almuerzo, propina de la tarde…" />
        </div>

        <div className="flex gap-2">
          <SubmitButton disabled={isPending}>Agregar movimiento</SubmitButton>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
