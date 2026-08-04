"use client";

import { useState, useTransition } from "react";
import { addRecurringBill } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

export function RecurringBillForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isAdding) {
    return (
      <Card className="flex items-center justify-between">
        <p className="text-sm text-muted">Registra un pago o suscripción que se repite cada mes.</p>
        <Button type="button" onClick={() => setIsAdding(true)}>
          Agregar pago mensual
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) => {
          startTransition(async () => {
            await addRecurringBill(formData);
            setIsAdding(false);
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="title">Nombre del pago</Label>
          <Input id="title" name="title" placeholder="Ej. Pago Entel" required />
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input id="description" name="description" placeholder="Detalles adicionales" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" min={0.01} step="0.01" placeholder="0.00" required />
          </div>
          <div>
            <Label htmlFor="priority">Prioridad</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIA"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDay">Desde (día del mes)</Label>
            <Input id="startDay" name="startDay" type="number" min={1} max={31} placeholder="Ej. 16" required />
          </div>
          <div>
            <Label htmlFor="endDay">Hasta (opcional)</Label>
            <Input id="endDay" name="endDay" type="number" min={1} max={31} placeholder="Ej. 21" />
          </div>
        </div>
        <p className="text-xs text-muted">
          Si dejas &quot;Hasta&quot; vacío, el pago queda disponible desde ese día hasta fin de mes (ej. una
          suscripción). Si lo completas, se pondrá en rojo en los últimos días de ese rango (ej. una factura con
          vencimiento). Si el mes tiene menos días que el número que pongas (ej. 30 o 31 en febrero), se ajusta
          automáticamente al último día real del mes.
        </p>

        <div className="flex gap-2">
          <SubmitButton disabled={isPending}>Agregar pago mensual</SubmitButton>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
