import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatDateEs } from "@/lib/date";
import { getCurrentWeekView } from "@/lib/exercise";
import { formatMuscleGroups, dayIcon } from "@/lib/routine-groups";
import { markWorkoutDone, unmarkWorkoutDone } from "@/actions/exercises";
import { Card } from "@/components/ui/card";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { WorkoutScheduleForm } from "@/components/workout-schedule-form";
import { cn } from "@/lib/cn";

export default async function EjercicioPage() {
  const { userId } = await verifySession();

  const [schedule, week] = await Promise.all([
    prisma.workoutSchedule.findUnique({ where: { userId } }),
    getCurrentWeekView(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ejercicio</h1>
          <p className="text-sm text-muted">Tu rutina semanal</p>
        </div>
        <Link href="/ejercicio/historial" className="text-sm font-medium text-accent hover:underline">
          Ver historial
        </Link>
      </div>

      <WorkoutScheduleForm schedule={schedule} />

      <div className="space-y-3">
        {week.map(({ date, groups, completed }) => {
          const Icon = dayIcon(groups);
          const isRest = groups.length === 0;
          return (
            <Card key={date.toISOString()} className="flex items-center gap-3 py-4">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  isRest ? "bg-surface-hover text-muted" : "bg-accent/15 text-accent"
                )}
              >
                <Icon className="size-5" />
              </div>

              {!isRest && (
                <ToggleCheckbox
                  checked={completed}
                  action={
                    completed
                      ? unmarkWorkoutDone.bind(null, date.getFullYear(), date.getMonth() + 1, date.getDate())
                      : markWorkoutDone.bind(null, date.getFullYear(), date.getMonth() + 1, date.getDate())
                  }
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{formatDateEs(date)}</p>
                <p className={cn("text-xs", completed ? "text-muted line-through" : "text-muted")}>
                  {formatMuscleGroups(groups)}
                </p>
              </div>
              {!isRest && completed && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Cumplido
                </span>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
