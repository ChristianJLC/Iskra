"use client";

import { useState, useTransition } from "react";
import { saveWorkoutSchedule } from "@/actions/exercises";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_OPTIONS, formatMuscleGroups } from "@/lib/routine-groups";
import type { MuscleGroup } from "@/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const EDITABLE_DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
] as const;

type EditableDay = (typeof EDITABLE_DAYS)[number]["key"];
type ScheduleDays = Record<EditableDay, MuscleGroup[]>;

function toggleGroup(groups: MuscleGroup[], group: MuscleGroup): MuscleGroup[] {
  return groups.includes(group) ? groups.filter((g) => g !== group) : [...groups, group];
}

export function WorkoutScheduleForm({ schedule }: { schedule: ScheduleDays | null }) {
  const [isEditing, setIsEditing] = useState(!schedule);
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState<ScheduleDays>(
    () =>
      Object.fromEntries(EDITABLE_DAYS.map(({ key }) => [key, schedule?.[key] ?? []])) as ScheduleDays
  );

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
      <div className="space-y-5">
        {EDITABLE_DAYS.map(({ key, label }) => {
          const selected = days[key];
          return (
            <div key={key}>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted">{formatMuscleGroups(selected)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUP_OPTIONS.map((group) => {
                  const active = selected.includes(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDays((prev) => ({ ...prev, [key]: toggleGroup(prev[key], group) }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border bg-surface text-muted hover:border-accent hover:text-foreground"
                      )}
                    >
                      {MUSCLE_GROUP_LABELS[group]}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={selected.length === 0}
                  onClick={() => setDays((prev) => ({ ...prev, [key]: [] }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected.length === 0
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface text-muted hover:border-accent hover:text-foreground"
                  )}
                >
                  Descanso
                </button>
              </div>
            </div>
          );
        })}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Domingo</p>
          <p className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-muted">
            Descanso
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await saveWorkoutSchedule(days);
                setIsEditing(false);
              });
            }}
          >
            {isPending ? "Guardando…" : "Guardar rutina"}
          </Button>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}
