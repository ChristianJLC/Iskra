"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, Moon } from "lucide-react";
import { saveWorkoutSchedule } from "@/actions/exercises";
import { MUSCLE_GROUP_LABELS, formatMuscleGroups } from "@/lib/routine-groups";
import type { MuscleGroup } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

const EDITABLE_DAYS = [
  { key: "monday", label: "Lunes", short: "L" },
  { key: "tuesday", label: "Martes", short: "M" },
  { key: "wednesday", label: "Miércoles", short: "M" },
  { key: "thursday", label: "Jueves", short: "J" },
  { key: "friday", label: "Viernes", short: "V" },
  { key: "saturday", label: "Sábado", short: "S" },
] as const;

const SUNDAY = "sunday";

const MUSCLE_SECTIONS: { title: string; groups: MuscleGroup[] }[] = [
  { title: "Tren superior", groups: ["PECHO", "ESPALDA", "BICEPS", "TRICEPS", "HOMBROS"] },
  { title: "Tren inferior y core", groups: ["PIERNAS", "GLUTEOS", "ABDOMINALES"] },
  { title: "Otros", groups: ["CARDIO", "BOMBEO"] },
];

type EditableDay = (typeof EDITABLE_DAYS)[number]["key"];
type ScheduleDays = Record<EditableDay, MuscleGroup[]>;

function toggleGroup(groups: MuscleGroup[], group: MuscleGroup): MuscleGroup[] {
  return groups.includes(group) ? groups.filter((g) => g !== group) : [...groups, group];
}

function toScheduleDays(schedule: ScheduleDays | null) {
  return Object.fromEntries(EDITABLE_DAYS.map(({ key }) => [key, schedule?.[key] ?? []])) as ScheduleDays;
}

export function WorkoutScheduleForm({
  schedule,
  triggerLabel,
  triggerClassName,
}: {
  schedule: ScheduleDays | null;
  triggerLabel: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState<ScheduleDays>(() => toScheduleDays(schedule));
  const [activeDay, setActiveDay] = useState<EditableDay | typeof SUNDAY>("monday");

  function open() {
    setDays(toScheduleDays(schedule));
    setActiveDay("monday");
    setIsOpen(true);
  }

  const isSunday = activeDay === SUNDAY;
  const selected = isSunday ? [] : days[activeDay];
  const activeLabel = isSunday ? "Domingo" : EDITABLE_DAYS.find(({ key }) => key === activeDay)?.label;
  const trainingDays = EDITABLE_DAYS.filter(({ key }) => days[key].length > 0).length;

  function save() {
    startTransition(async () => {
      await saveWorkoutSchedule(days);
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex h-10 shrink-0 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover",
          triggerClassName
        )}
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <Sheet
          title="Tu rutina semanal"
          description="Elige un día y marca qué vas a entrenar."
          busy={isPending}
          onClose={() => setIsOpen(false)}
        >
            <div className="px-5 pt-4 sm:px-6">
              <div className="grid grid-cols-7 gap-1 rounded-2xl bg-surface-2 p-1">
                {[...EDITABLE_DAYS, { key: SUNDAY, label: "Domingo", short: "D" } as const].map(({ key, label, short }) => {
                  const active = key === activeDay;
                  const hasGroups = key !== SUNDAY && days[key].length > 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={label}
                      aria-pressed={active}
                      onClick={() => setActiveDay(key)}
                      className={cn(
                        "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium transition-colors",
                        active ? "text-background" : "text-muted hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="routine-day-indicator"
                          className="absolute inset-0 rounded-xl bg-foreground shadow-soft"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">{short}</span>
                      <span
                        className={cn(
                          "relative size-1 rounded-full",
                          hasGroups ? (active ? "bg-[var(--ember)]" : "bg-accent") : "bg-transparent"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight text-foreground">{activeLabel}</p>
                  <p className="truncate text-sm text-muted">
                    {isSunday ? "El domingo siempre es descanso" : formatMuscleGroups(selected)}
                  </p>
                </div>
                {!isSunday && (
                  <button
                    type="button"
                    aria-pressed={selected.length === 0}
                    onClick={() => setDays((prev) => ({ ...prev, [activeDay]: [] }))}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                      selected.length === 0
                        ? "bg-accent/15 text-accent"
                        : "bg-surface-2 text-foreground hover:bg-surface-hover"
                    )}
                  >
                    <Moon className="size-4" />
                    Día libre
                  </button>
                )}
              </div>

              {isSunday ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 px-4 py-10 text-center">
                  <Moon className="size-6 text-muted" />
                  <p className="text-sm text-muted">Tu cuerpo también necesita recuperarse.</p>
                </div>
              ) : (
                <div key={activeDay} className="reveal space-y-4">
                  {MUSCLE_SECTIONS.map(({ title, groups }) => (
                    <section key={title} className="space-y-2">
                      <h3 className="text-xs font-medium text-muted">{title}</h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {groups.map((group) => {
                          const active = selected.includes(group);
                          return (
                            <button
                              key={group}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setDays((prev) => ({ ...prev, [activeDay]: toggleGroup(prev[activeDay as EditableDay], group) }))
                              }
                              className={cn(
                                "flex h-12 items-center justify-between gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors",
                                active
                                  ? "bg-foreground text-background"
                                  : "bg-surface-2 text-foreground hover:bg-surface-hover"
                              )}
                            >
                              <span className="truncate">{MUSCLE_GROUP_LABELS[group]}</span>
                              {active && <Check className="size-4 shrink-0" strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 sm:px-6">
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">{trainingDays}</span>{" "}
                {trainingDays === 1 ? "día" : "días"} de entreno
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" variant="solid" className="h-11" disabled={isPending} onClick={save}>
                  {isPending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
        </Sheet>
      )}
    </>
  );
}
