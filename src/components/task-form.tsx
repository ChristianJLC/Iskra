"use client";

import { useState, useTransition } from "react";
import { addTask } from "@/actions/tasks";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

export function TaskForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isAdding) {
    return (
      <Card className="flex items-center justify-between">
        <p className="text-sm text-muted">Agrega una tarea o pendiente nuevo.</p>
        <Button type="button" onClick={() => setIsAdding(true)}>
          Añadir pendiente
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) => {
          startTransition(async () => {
            await addTask(formData);
            setIsAdding(false);
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="title">Tarea</Label>
          <Input id="title" name="title" placeholder="Ej. Pagar el internet" required />
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input id="description" name="description" placeholder="Detalles adicionales" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dueDate">Fecha límite</Label>
            <Input id="dueDate" name="dueDate" type="date" />
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

        <div className="flex gap-2">
          <SubmitButton disabled={isPending}>Agregar tarea</SubmitButton>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
