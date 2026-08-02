"use client";

import { useState, useTransition } from "react";
import { saveWorkoutSchedule } from "@/actions/exercises";
import { ROUTINE_GROUP_LABELS, ROUTINE_GROUP_OPTIONS } from "@/lib/routine-groups";
import type { RoutineGroup } from "@/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

const EDITABLE_DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
] as const;

type ScheduleDays = Record<(typeof EDITABLE_DAYS)[number]["key"], RoutineGroup>;

export function WorkoutScheduleForm({ schedule }: { schedule: ScheduleDays | null }) {
  const [isEditing, setIsEditing] = useState(!schedule);
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Rutina configurada</p>
          <p className="text-xs text-muted">Domingo es siempre descanso.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          Configurar rutina
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        action={(formData) => {
          startTransition(async () => {
            await saveWorkoutSchedule(formData);
            setIsEditing(false);
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          {EDITABLE_DAYS.map(({ key, label }) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <select
                id={key}
                name={key}
                defaultValue={schedule?.[key] ?? "DESCANSO"}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {ROUTINE_GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group}>
                    {ROUTINE_GROUP_LABELS[group]}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <Label>Domingo</Label>
            <p className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-muted">
              Descanso
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <SubmitButton>Guardar rutina</SubmitButton>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
