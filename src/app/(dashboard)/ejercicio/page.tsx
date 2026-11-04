import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatDateEs, getZonedCalendarDate } from "@/lib/date";
import { getCurrentWeekView, getMonthlyCompliance, getWorkoutStreak } from "@/lib/exercise";
import { buildWorkoutView } from "@/lib/exercise-summary";
import { WorkoutDashboard } from "@/components/workout-dashboard";
import { WorkoutScheduleForm } from "@/components/workout-schedule-form";

export default async function EjercicioPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const today = getZonedCalendarDate(timezone);

  const [schedule, week, streak, month] = await Promise.all([
    prisma.workoutSchedule.findUnique({ where: { userId } }),
    getCurrentWeekView(userId, timezone),
    getWorkoutStreak(userId, timezone),
    getMonthlyCompliance(userId, today.month, today.year, timezone),
  ]);

  const view = buildWorkoutView({
    today,
    week: week.map(({ cal, groups, completed }) => ({ cal, groups, completed })),
    streak,
    month: { scheduled: month.scheduled, completed: month.completed },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="reveal flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ejercicio</h1>
          <p className="text-sm text-muted">{formatDateEs(new Date(), timezone)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ejercicio/historial"
            className="flex h-10 items-center gap-1 rounded-full bg-surface-2 pr-2.5 pl-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Historial
            <ChevronRight className="size-4" />
          </Link>
          {view.hasRoutine && <WorkoutScheduleForm schedule={schedule} triggerLabel="Editar rutina" />}
        </div>
      </div>

      <WorkoutDashboard view={view} schedule={schedule} />
    </div>
  );
}
