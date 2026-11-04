import { Check, Flame, Moon } from "lucide-react";
import { markWorkoutDone, unmarkWorkoutDone } from "@/actions/exercises";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { WorkoutDoneButton } from "@/components/workout-done-button";
import { WorkoutScheduleForm } from "@/components/workout-schedule-form";
import { cn } from "@/lib/cn";
import type { WeekDayState, WorkoutView } from "@/lib/exercise-summary";
import type { MuscleGroup } from "@/generated/prisma/client";

type Schedule = Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday", MuscleGroup[]>;

const HERO_EMBERS = [
  { left: "58%", drift: "14px", duration: "5s", delay: "0s" },
  { left: "68%", drift: "-12px", duration: "6.5s", delay: "1.4s" },
  { left: "76%", drift: "18px", duration: "5.5s", delay: "2.6s" },
  { left: "86%", drift: "-16px", duration: "7s", delay: "0.8s" },
  { left: "94%", drift: "10px", duration: "6s", delay: "3.4s" },
];

const DAY_STYLES: Record<WeekDayState, string> = {
  done: "bg-accent/10",
  today: "bg-surface-1 ring-2 ring-foreground",
  missed: "bg-danger/5",
  upcoming: "bg-surface-2",
  rest: "border border-dashed border-border",
};

const DAY_STATUS: Record<WeekDayState, { text: string; className: string }> = {
  done: { text: "Hecho", className: "text-accent" },
  today: { text: "Toca hoy", className: "text-foreground" },
  missed: { text: "Sin marcar", className: "text-danger" },
  upcoming: { text: "Programado", className: "text-muted" },
  rest: { text: "Descanso", className: "text-muted" },
};

function TodayHero({ view, schedule }: { view: WorkoutView; schedule: Schedule | null }) {
  const { today } = view;
  const showDone = !today.isRest && today.completed;

  return (
    <div className="relative flex h-full min-h-72 flex-col justify-between gap-8 overflow-hidden rounded-3xl border border-white/10 bg-[#14141a] p-6 text-white shadow-soft sm:p-8">
      <div aria-hidden="true" className="hero-hearth pointer-events-none absolute inset-0" />
      {showDone && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {HERO_EMBERS.map(({ left, drift, duration, delay }) => (
            <span
              key={left}
              className="ember absolute bottom-0 size-1 rounded-full bg-[var(--ember)]"
              style={{ left, "--drift": drift, "--duration": duration, "--delay": delay } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <p className="text-sm font-medium text-white/60">Hoy, {today.name.toLowerCase()}</p>

        {!view.hasRoutine ? (
          <>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Arma tu semana</h2>
            <p className="mt-3 max-w-md text-sm text-white/60">
              Elige qué entrenar cada día y aquí verás lo que te toca hoy.
            </p>
          </>
        ) : today.isRest ? (
          <>
            <h2 className="mt-2 flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Día libre
              <Moon className="size-8 text-white/40" />
            </h2>
            <p className="mt-3 text-sm text-white/60">Hoy no te toca entrenar.</p>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {today.groupsLabel}
            </h2>
            {showDone && (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--ember)] text-[#14141a]">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                Entrenamiento hecho
              </p>
            )}
          </>
        )}
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!view.hasRoutine ? (
          <WorkoutScheduleForm
            schedule={schedule}
            triggerLabel="Armar mi rutina"
            triggerClassName="h-12 w-full justify-center rounded-xl bg-white px-6 text-[#14141a] hover:bg-white/90 sm:w-auto"
          />
        ) : !today.isRest ? (
          <WorkoutDoneButton cal={today.cal} completed={today.completed} />
        ) : null}

        {view.next && (
          <p className="text-sm text-white/60">
            {view.next.when}: <span className="font-medium text-white">{view.next.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function StatsColumn({ view }: { view: WorkoutView }) {
  const monthPercent = view.month.scheduled ? (view.month.completed / view.month.scheduled) * 100 : 0;

  return (
    <div className="grid h-full grid-cols-2 gap-4">
      <Card className="col-span-2 flex items-center gap-5 rounded-3xl">
        <ProgressRing percent={view.weekTotal ? (view.weekDone / view.weekTotal) * 100 : 0} size={96} strokeWidth={10}>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            <CountUp value={view.weekDone} />
            <span className="text-sm text-muted">/{view.weekTotal}</span>
          </p>
        </ProgressRing>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted">Esta semana</h2>
          <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            {view.weekTotal === 0
              ? "Sin entrenamientos"
              : view.weekDone === view.weekTotal
                ? "Semana completa"
                : `Te ${view.weekTotal - view.weekDone === 1 ? "falta" : "faltan"} ${view.weekTotal - view.weekDone}`}
          </p>
          {view.weekMissed > 0 && (
            <p className="mt-0.5 text-xs text-danger">
              {view.weekMissed} {view.weekMissed === 1 ? "día" : "días"} sin marcar
            </p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col justify-between gap-3 rounded-3xl">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted">
          <Flame className={cn("size-4", view.streak > 0 && "text-accent")} />
          Racha
        </h2>
        <div>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            <CountUp value={view.streak} />
          </p>
          <p className="text-xs text-muted">{view.streak === 1 ? "entrenamiento seguido" : "entrenamientos seguidos"}</p>
        </div>
      </Card>

      <Card className="flex flex-col justify-between gap-3 rounded-3xl">
        <h2 className="text-sm font-medium text-muted">Este mes</h2>
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            <CountUp value={view.month.completed} />
            <span className="text-sm font-normal tracking-normal text-muted"> de {view.month.scheduled}</span>
          </p>
          <ProgressBar percent={monthPercent} className="h-1.5" />
        </div>
      </Card>
    </div>
  );
}

function WeekBoard({ view }: { view: WorkoutView }) {
  return (
    <Card className="rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Tu semana</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-7">
        {view.days.map((day) => {
          const status = DAY_STATUS[day.state];
          return (
            <li
              key={day.key}
              aria-current={day.isToday ? "date" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3 xl:min-h-40 xl:flex-col xl:items-start xl:justify-between",
                DAY_STYLES[day.state]
              )}
            >
              <div className="w-11 shrink-0 xl:w-auto">
                <p className="text-sm font-semibold text-foreground">{day.shortName}</p>
                <p className="text-xs text-muted tabular-nums">{day.cal.day}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", day.isRest ? "text-muted" : "text-foreground")}>
                  {day.groupsLabel}
                </p>
                {!day.isRest && <p className={cn("text-xs", status.className)}>{status.text}</p>}
              </div>

              {day.canToggle && (
                <ToggleCheckbox
                  checked={day.completed}
                  label={`${day.name}: ${day.completed ? "desmarcar" : "marcar como hecho"}`}
                  className="size-8 rounded-xl"
                  action={
                    day.completed
                      ? unmarkWorkoutDone.bind(null, day.cal.year, day.cal.month, day.cal.day)
                      : markWorkoutDone.bind(null, day.cal.year, day.cal.month, day.cal.day)
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function MusclesCard({ view }: { view: WorkoutView }) {
  return (
    <Card className="rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Músculos de esta semana</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {view.muscles.map(({ group, label, planned, done }) => (
          <li key={group} className="rounded-2xl bg-surface-2 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              <p className="shrink-0 text-xs text-muted tabular-nums">
                {done}/{planned}
              </p>
            </div>
            <ProgressBar percent={(done / planned) * 100} className="mt-2 h-1.5 bg-surface" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function WorkoutDashboard({ view, schedule }: { view: WorkoutView; schedule: Schedule | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className={cn("reveal [--i:1]", view.hasRoutine ? "lg:col-span-7" : "lg:col-span-12")}>
        <TodayHero view={view} schedule={schedule} />
      </div>
      {view.hasRoutine && (
        <>
          <div className="reveal [--i:2] lg:col-span-5">
            <StatsColumn view={view} />
          </div>
          <div className="reveal [--i:3] lg:col-span-12">
            <WeekBoard view={view} />
          </div>
          <div className="reveal [--i:4] lg:col-span-12">
            <MusclesCard view={view} />
          </div>
        </>
      )}
    </div>
  );
}
