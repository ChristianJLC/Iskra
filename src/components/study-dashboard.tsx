"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronRight, Clock, Flame, Moon, Pause, Play, Plus } from "lucide-react";
import { extendStudy, pauseTimer, startSubjectSession, startTimer } from "@/actions/studies";
import { toggleTask } from "@/actions/tasks";
import { LogTimeSheet, SubjectSheet } from "@/components/study-sheets";
import { TaskFormSheet } from "@/components/task-form";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { WEEKDAYS, formatMinutes, type StudyItem, type StudySubjectView, type StudyView } from "@/lib/study-summary";
import { cn } from "@/lib/cn";

const HERO_EMBERS = [
  { left: "58%", drift: "14px", duration: "5s", delay: "0s" },
  { left: "68%", drift: "-12px", duration: "6.5s", delay: "1.4s" },
  { left: "76%", drift: "18px", duration: "5.5s", delay: "2.6s" },
  { left: "86%", drift: "-16px", duration: "7s", delay: "0.8s" },
  { left: "94%", drift: "10px", duration: "6s", delay: "3.4s" },
];

const TONE_CLASS = { danger: "text-danger", warning: "text-warning", neutral: "text-muted" };

const HERO_PRIMARY =
  "h-12 w-full whitespace-nowrap bg-white px-6 text-[#14141a] shadow-none hover:bg-white/90 sm:w-auto";
const HERO_SECONDARY =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-white/15 sm:w-auto";

type SheetState =
  | { kind: "subject"; subject?: StudySubjectView }
  | { kind: "log"; item: StudyItem }
  | { kind: "task" }
  | null;

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

/**
 * Segundos desde que llegó el dato del servidor. Se mide contra el reloj y no sumando
 * de a uno, porque el navegador frena los intervalos en pestañas en segundo plano.
 */
function useElapsedSince(syncKey: string | null) {
  const [tick, setTick] = useState({ key: syncKey, value: 0 });

  useEffect(() => {
    if (!syncKey) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setTick({ key: syncKey, value: Math.floor((Date.now() - startedAt) / 1000) });
    }, 1000);
    return () => clearInterval(interval);
  }, [syncKey]);

  return tick.key === syncKey ? tick.value : 0;
}

function useSessionToggle(item: StudyItem | null) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!item) return;
    startTransition(async () => {
      if (item.running && item.entryId) await pauseTimer(item.entryId);
      else if (item.entryId) await startTimer(item.entryId);
      else if (item.subjectId) await startSubjectSession(item.subjectId);
    });
  }

  return { isPending, toggle };
}

function HeroFrame({ glowing, children }: { glowing: boolean; children: React.ReactNode }) {
  return (
    <div className="relative flex h-full min-h-72 flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#14141a] p-6 text-white shadow-soft sm:p-8">
      <div aria-hidden="true" className="hero-hearth pointer-events-none absolute inset-0" />
      {glowing && (
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
      {children}
    </div>
  );
}

function FocusHero({
  item,
  seconds,
  after,
  onLog,
}: {
  item: StudyItem;
  seconds: number;
  after: StudyView["afterActive"];
  onLog: () => void;
}) {
  const { isPending, toggle } = useSessionToggle(item);
  const targetSeconds = item.targetMinutes * 60;
  const remaining = Math.max(targetSeconds - seconds, 0);
  const studied = Math.floor(seconds / 60);
  const started = seconds > 0;

  return (
    <HeroFrame glowing={item.running}>
      <div className="relative min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-white/60">
          {item.running && (
            <span aria-hidden="true" className="size-2 rounded-full bg-[var(--ember)] motion-safe:animate-pulse" />
          )}
          {item.running ? "Estudiando ahora" : started ? "Para continuar" : "Te toca ahora"}
        </p>
        <h2 className="mt-1 text-2xl leading-tight font-semibold tracking-tight break-words sm:text-3xl">{item.name}</h2>
      </div>

      <div className="relative">
        <p
          role="timer"
          aria-label={`Quedan ${Math.ceil(remaining / 60)} minutos`}
          className="text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl"
        >
          {formatClock(remaining)}
        </p>
        <p className="mt-1 text-sm text-white/60">
          {started
            ? `Llevas ${formatMinutes(studied)} de ${formatMinutes(item.targetMinutes)}`
            : `Sesión de ${formatMinutes(item.targetMinutes)}`}
        </p>
        <ProgressBar
          percent={(seconds / targetSeconds) * 100}
          className="mt-3 h-1.5 bg-white/10"
          fillClassName="bg-[var(--ember)]"
        />
      </div>

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="solid"
            disabled={isPending}
            whileHover={isPending ? undefined : { y: -2 }}
            onClick={toggle}
            className={HERO_PRIMARY}
          >
            {item.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {item.running ? "Pausar" : started ? "Continuar" : "Empezar"}
          </Button>
          <button type="button" onClick={onLog} className={HERO_SECONDARY}>
            <Clock className="size-4" />
            Registrar tiempo
          </button>
        </div>
        {after && (
          <p className="min-w-0 text-sm text-white/60">
            Después: <span className="font-medium text-white">{after.name}</span>
          </p>
        )}
      </div>
    </HeroFrame>
  );
}

function NextUp({ next }: { next: StudyView["next"] }) {
  if (!next) return null;
  return (
    <p className="min-w-0 text-sm text-white/60">
      {next.when}: <span className="font-medium text-white">{next.label}</span>
    </p>
  );
}

function DoneHero({ items, next }: { items: StudyItem[]; next: StudyView["next"] }) {
  const [isPending, startTransition] = useTransition();
  const last = items[items.length - 1];
  const studied = Math.floor(items.reduce((sum, item) => sum + item.seconds, 0) / 60);

  return (
    <HeroFrame glowing>
      <div className="relative">
        <p className="text-sm font-medium text-white/60">Tu estudio de hoy</p>
        <h2 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">Todo listo</h2>
        <p className="mt-3 flex items-center gap-2 text-sm font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--ember)] text-[#14141a]">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          Estudiaste {formatMinutes(studied)}
        </p>
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {last?.entryId && (
          <Button
            type="button"
            variant="solid"
            disabled={isPending}
            whileHover={isPending ? undefined : { y: -2 }}
            onClick={() => startTransition(() => extendStudy(last.entryId!))}
            className={HERO_PRIMARY}
          >
            <Plus className="size-4" />
            Seguir 15 min más
          </Button>
        )}
        <NextUp next={next} />
      </div>
    </HeroFrame>
  );
}

function SetupHero({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <HeroFrame glowing={false}>
      <div className="relative">
        <p className="text-sm font-medium text-white/60">Tu plan de estudio</p>
        <h2 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{title}</h2>
        <p className="mt-3 max-w-md text-sm text-white/60">{description}</p>
      </div>
      <div className="relative">
        <Button
          type="button"
          variant="solid"
          whileHover={{ y: -2 }}
          onClick={onAction}
          className={HERO_PRIMARY}
        >
          {action}
        </Button>
      </div>
    </HeroFrame>
  );
}

function RestHero({ next }: { next: StudyView["next"] }) {
  return (
    <HeroFrame glowing={false}>
      <div className="relative">
        <p className="text-sm font-medium text-white/60">Tu plan de estudio</p>
        <h2 className="mt-2 flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Día libre
          <Moon className="size-8 text-white/40" />
        </h2>
        <p className="mt-3 text-sm text-white/60">Hoy no te toca ninguna materia.</p>
      </div>
      <div className="relative">
        <NextUp next={next} />
      </div>
    </HeroFrame>
  );
}

function StatsColumn({
  view,
  todayActual,
  todayPercent,
  todayLeft,
}: {
  view: StudyView;
  todayActual: number;
  todayPercent: number;
  todayLeft: number;
}) {
  const hasToday = view.items.length > 0;
  const monthHours = Math.floor(view.month.minutes / 60);
  const monthRest = view.month.minutes % 60;

  return (
    <div className="grid h-full grid-cols-2 gap-4">
      <Card className="col-span-2 flex items-center gap-5 rounded-3xl">
        <ProgressRing percent={todayPercent} size={96} strokeWidth={10}>
          {hasToday ? (
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              <CountUp value={todayPercent} />
              <span className="text-sm text-muted">%</span>
            </p>
          ) : (
            <BookOpen className="size-6 text-muted" />
          )}
        </ProgressRing>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted">Hoy</h2>
          <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            {!hasToday
              ? "Sin estudio programado"
              : todayLeft === 0
                ? "Meta cumplida"
                : `Te ${todayLeft === 1 ? "falta" : "faltan"} ${formatMinutes(todayLeft)}`}
          </p>
          {hasToday && <p className="mt-0.5 text-xs text-muted">{formatMinutes(todayActual)} estudiados</p>}
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
          <p className="text-xs text-muted">
            {view.streak === 1 ? "día cumpliendo tu plan" : "días cumpliendo tu plan"}
          </p>
        </div>
      </Card>

      <Card className="flex flex-col justify-between gap-3 rounded-3xl">
        <h2 className="text-sm font-medium text-muted">Este mes</h2>
        <div>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            <CountUp value={monthHours > 0 ? monthHours : monthRest} />
            <span className="text-sm font-normal tracking-normal text-muted">
              {monthHours > 0 ? ` h${monthRest > 0 ? ` ${monthRest} min` : ""}` : " min"}
            </span>
          </p>
          <p className="text-xs text-muted">
            {view.month.daysStudied === 0
              ? "Aún sin estudiar"
              : `en ${view.month.daysStudied} ${view.month.daysStudied === 1 ? "día" : "días"}`}
          </p>
        </div>
      </Card>
    </div>
  );
}

function SessionRow({
  item,
  seconds,
  onLog,
}: {
  item: StudyItem;
  seconds: number;
  onLog: () => void;
}) {
  const { isPending, toggle } = useSessionToggle(item);
  const [isExtending, startExtend] = useTransition();
  const studied = Math.floor(seconds / 60);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3 transition-colors",
        item.running ? "bg-surface-1 ring-2 ring-foreground" : "bg-surface-2"
      )}
    >
      {item.done ? (
        <span
          aria-label="Completada"
          role="img"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
      ) : (
        <button
          type="button"
          disabled={isPending}
          aria-label={`${item.running ? "Pausar" : "Empezar"} ${item.name}`}
          onClick={toggle}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-50",
            item.running ? "bg-foreground text-background" : "bg-surface-1 text-foreground shadow-soft"
          )}
        >
          {item.running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={cn("line-clamp-2 text-sm font-medium break-words", item.done ? "text-muted" : "text-foreground")}>
            {item.name}
          </p>
          <p className="shrink-0 text-xs text-muted tabular-nums">
            {studied} / {item.targetMinutes} min
          </p>
        </div>
        <ProgressBar percent={(seconds / (item.targetMinutes * 60)) * 100} className="mt-2 h-1.5 bg-surface-hover" />
        {!item.required && <p className="mt-1 text-xs text-muted">Sesión extra de hoy</p>}
      </div>

      {item.done && item.entryId && (
        <button
          type="button"
          disabled={isExtending}
          onClick={() => startExtend(() => extendStudy(item.entryId!))}
          className="hidden h-9 shrink-0 items-center rounded-full bg-surface-1 px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50 sm:flex"
        >
          +15 min
        </button>
      )}

      <button
        type="button"
        aria-label={`Registrar tiempo de ${item.name}`}
        onClick={onLog}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <Clock className="size-4" />
      </button>
    </li>
  );
}

function OtherSubjectRow({ subject }: { subject: StudyView["others"][number] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium break-words text-foreground">{subject.name}</p>
        <p className="text-xs text-muted">Sesión de {formatMinutes(subject.targetMinutes)}</p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => startSubjectSession(subject.id))}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        <Play className="size-3.5" />
        {isPending ? "Empezando…" : "Estudiar hoy"}
      </button>
    </li>
  );
}

function TodayCard({
  view,
  secondsOf,
  onLog,
}: {
  view: StudyView;
  secondsOf: (item: StudyItem) => number;
  onLog: (item: StudyItem) => void;
}) {
  const doneCount = view.items.filter((item) => item.done).length;

  return (
    <Card className="h-full rounded-3xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Plan de hoy</h2>
        {view.items.length > 0 && (
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground tabular-nums">{doneCount}</span> de {view.items.length}{" "}
            {view.items.length === 1 ? "lista" : "listas"}
          </p>
        )}
      </div>

      {view.items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {view.items.map((item) => (
            <SessionRow key={item.key} item={item} seconds={secondsOf(item)} onLog={() => onLog(item)} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No hay materias programadas para hoy.</p>
      )}

      {view.others.length > 0 && (
        <div className={cn("mt-4", view.items.length > 0 && "border-t border-border/70 pt-3")}>
          <h3 className="text-xs font-medium text-muted">
            {view.items.length > 0 ? "También puedes estudiar" : "Si quieres estudiar igual"}
          </h3>
          <ul className="mt-1">
            {view.others.map((subject) => (
              <OtherSubjectRow key={subject.id} subject={subject} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function weekInsight(week: StudyView["week"], actualMinutes: number) {
  if (week.plannedMinutes === 0 && actualMinutes === 0) return "Asigna días a tus materias para ver tu plan de la semana.";
  if (actualMinutes >= week.plannedMinutes) return "Cumpliste el tiempo de tu plan esta semana.";
  const left = formatMinutes(week.plannedMinutes - actualMinutes);
  if (week.behindMinutes > 0) return `Te faltan ${left} esta semana; ${formatMinutes(week.behindMinutes)} vienen de días anteriores.`;
  return `Vas al día: te faltan ${left} para cerrar la semana.`;
}

function WeekCard({ week, todayActual }: { week: StudyView["week"]; todayActual: number }) {
  const days = week.days.map((day) => (day.isToday ? { ...day, actualMinutes: todayActual } : day));
  const actualMinutes = days.reduce((sum, day) => sum + day.actualMinutes, 0);
  const scale = Math.max(30, ...days.flatMap((day) => [day.plannedMinutes, day.actualMinutes]));

  if (week.plannedMinutes === 0 && actualMinutes === 0) {
    return (
      <Card className="h-full rounded-3xl">
        <h2 className="text-sm font-medium text-muted">Tu semana</h2>
        <p className="mt-3 text-sm text-muted">{weekInsight(week, actualMinutes)}</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col rounded-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-muted">Tu semana</h2>
        <p className="text-sm text-muted">
          <span className="font-medium text-foreground">{formatMinutes(actualMinutes)}</span>
          {week.plannedMinutes > 0 && ` de ${formatMinutes(week.plannedMinutes)}`}
        </p>
      </div>

      <ul className="mt-4 grid flex-1 grid-cols-7 gap-1.5">
        {days.map((day, index) => (
          <li key={day.key} className="group relative flex min-h-36 flex-col">
            <div
              role="img"
              tabIndex={0}
              aria-label={`${day.name}: ${formatMinutes(day.actualMinutes)} de ${formatMinutes(day.plannedMinutes)} planeados`}
              className="relative flex-1 rounded-lg outline-none transition-colors group-hover:bg-surface-2/60 focus-visible:ring-2 focus-visible:ring-accent"
            >
              {day.plannedMinutes > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 mx-auto max-w-7 rounded-t bg-border"
                  style={{ height: `${(day.plannedMinutes / scale) * 100}%` }}
                />
              )}
              {day.actualMinutes > 0 && (
                <div
                  className="water-fill absolute inset-x-0 bottom-0 mx-auto max-w-7 rounded-t bg-accent transition-[height] duration-700"
                  style={
                    {
                      height: `max(4px, ${(day.actualMinutes / scale) * 100}%)`,
                      "--i": index,
                    } as React.CSSProperties
                  }
                />
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-center text-xs",
                day.isToday ? "font-semibold text-foreground" : "text-muted"
              )}
            >
              {day.short}
            </p>
            <span
              aria-hidden="true"
              className={cn("mx-auto mt-0.5 size-1 rounded-full", day.isToday ? "bg-accent" : "bg-transparent")}
            />
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-40 rounded-lg bg-foreground px-2 py-1 text-xs text-background shadow-soft group-focus-within:block group-hover:block",
                index > 3 ? "right-0" : "left-0"
              )}
            >
              {day.name}: {formatMinutes(day.actualMinutes)}
              {day.plannedMinutes > 0 && ` de ${formatMinutes(day.plannedMinutes)}`}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-accent" />
          Estudiado
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-border" />
          Planeado
        </span>
      </div>

      <p className="mt-2 text-sm text-foreground">{weekInsight(week, actualMinutes)}</p>
    </Card>
  );
}

function DayLetters({ weekdays }: { weekdays: number[] }) {
  if (weekdays.length === 0) return <p className="text-xs text-warning">Sin días fijos</p>;

  const names = WEEKDAYS.filter(({ value }) => weekdays.includes(value)).map(({ name }) => name);

  return (
    <div role="img" aria-label={names.join(", ")} className="flex gap-0.5">
      {WEEKDAYS.map(({ value, short }) => (
        <span
          key={value}
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
            weekdays.includes(value) ? "bg-foreground text-background" : "text-muted/60"
          )}
        >
          {short}
        </span>
      ))}
    </div>
  );
}

function SubjectsCard({
  subjects,
  onAdd,
  onEdit,
}: {
  subjects: StudySubjectView[];
  onAdd: () => void;
  onEdit: (subject: StudySubjectView) => void;
}) {
  return (
    <Card className="h-full rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Materias</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1 rounded-full bg-surface-2 pr-3.5 pl-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          <Plus className="size-4" />
          Agregar
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <button
              type="button"
              aria-label={`Editar ${subject.name}`}
              onClick={() => onEdit(subject)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left transition-colors hover:bg-surface-hover"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="line-clamp-2 min-w-0 text-sm font-medium break-words text-foreground">{subject.name}</p>
                  <p className="shrink-0 text-xs text-muted">{formatMinutes(subject.monthMinutes)} este mes</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <DayLetters weekdays={subject.weekdays} />
                  <p className="text-xs text-muted">
                    {subject.weekPlannedMinutes > 0
                      ? `${formatMinutes(subject.weekMinutes)} de ${formatMinutes(subject.weekPlannedMinutes)} esta semana`
                      : `${formatMinutes(subject.weekMinutes)} esta semana`}
                  </p>
                </div>
                {subject.weekPlannedMinutes > 0 && (
                  <ProgressBar
                    percent={(subject.weekMinutes / subject.weekPlannedMinutes) * 100}
                    className="h-1.5 bg-surface-hover"
                  />
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TasksCard({ tasks, onAdd }: { tasks: StudyView["tasks"]; onAdd: () => void }) {
  const visible = tasks.slice(0, 5);

  return (
    <Card className="h-full rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Entregas y exámenes</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1 rounded-full bg-surface-2 pr-3.5 pl-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          <Plus className="size-4" />
          Agregar
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No tienes pendientes. Anota aquí tus exámenes y trabajos para verlos junto a tu plan.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {visible.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2.5">
              <ToggleCheckbox
                checked={false}
                label={`Marcar "${task.title}" como hecha`}
                className="size-8 rounded-xl"
                action={toggleTask.bind(null, task.id, true)}
              />
              <p className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</p>
              {task.dueText && (
                <p className={cn("shrink-0 text-xs font-medium", TONE_CLASS[task.dueTone])}>{task.dueText}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {tasks.length > visible.length && (
        <Link
          href="/organizacion"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
        >
          Ver {tasks.length - visible.length} más
          <ChevronRight className="size-4" />
        </Link>
      )}
    </Card>
  );
}

export function StudyDashboard({ view, todayIso }: { view: StudyView; todayIso: string }) {
  const [sheet, setSheet] = useState<SheetState>(null);
  const [, startAutoStop] = useTransition();

  const runningItem = view.items.find((item) => item.running) ?? null;
  const syncKey = runningItem ? `${runningItem.key}:${runningItem.seconds}` : null;
  const elapsed = useElapsedSince(syncKey);

  const secondsOf = (item: StudyItem) =>
    item.running
      ? Math.min(item.seconds + elapsed, Math.max(item.seconds, item.targetMinutes * 60))
      : item.seconds;

  const active = view.items.find((item) => item.key === view.activeKey) ?? null;
  const activeSeconds = active ? secondsOf(active) : 0;

  const stoppedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!runningItem?.entryId || !syncKey) return;
    if (secondsOf(runningItem) < runningItem.targetMinutes * 60 || stoppedKey.current === syncKey) return;
    stoppedKey.current = syncKey;
    const { entryId } = runningItem;
    startAutoStop(() => pauseTimer(entryId));
  });

  const tabClock = runningItem && active ? formatClock(Math.max(active.targetMinutes * 60 - activeSeconds, 0)) : null;
  useEffect(() => {
    if (!tabClock || !active) return;
    const previous = document.title;
    document.title = `${tabClock} · ${active.name}`;
    return () => {
      document.title = previous;
    };
  }, [tabClock, active]);

  const totals = view.items.reduce(
    (sum, item) => {
      const seconds = secondsOf(item);
      const target = item.targetMinutes * 60;
      return {
        actual: sum.actual + seconds,
        counted: sum.counted + Math.min(seconds, target),
        target: sum.target + target,
        left: sum.left + Math.max(item.targetMinutes - Math.floor(seconds / 60), 0),
      };
    },
    { actual: 0, counted: 0, target: 0, left: 0 }
  );
  const todayActual = Math.floor(totals.actual / 60);
  const todayPercent = totals.target ? Math.floor((totals.counted / totals.target) * 100) : 0;

  const firstUnscheduled = view.subjects.find((subject) => subject.id === view.firstUnscheduledId);

  function renderHero() {
    if (active) {
      return (
        <FocusHero
          item={active}
          seconds={activeSeconds}
          after={view.afterActive}
          onLog={() => setSheet({ kind: "log", item: { ...active, seconds: activeSeconds } })}
        />
      );
    }
    if (view.items.length > 0) return <DoneHero items={view.items} next={view.next} />;
    if (!view.hasSubjects) {
      return (
        <SetupHero
          title="Arma tu plan"
          description="Agrega lo que estudias y elige qué días te toca. Aquí verás cada día qué sigue y cuánto te falta."
          action="Agregar mi primera materia"
          onAction={() => setSheet({ kind: "subject" })}
        />
      );
    }
    if (!view.hasPlan) {
      return (
        <SetupHero
          title="Organiza tu semana"
          description={`Elige qué días toca ${firstUnscheduled?.name ?? "cada materia"} y aquí aparecerá lo que te toca hoy, sin agregarlo a mano.`}
          action="Elegir días"
          onAction={() => setSheet({ kind: "subject", subject: firstUnscheduled })}
        />
      );
    }
    return <RestHero next={view.next} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={cn("reveal [--i:1]", view.hasSubjects ? "lg:col-span-7" : "lg:col-span-12")}>{renderHero()}</div>

        {view.hasSubjects && (
          <>
            <div className="reveal [--i:2] lg:col-span-5">
              <StatsColumn
                view={view}
                todayActual={todayActual}
                todayPercent={todayPercent}
                todayLeft={totals.left}
              />
            </div>
            <div className="reveal [--i:3] lg:col-span-7">
              <TodayCard
                view={view}
                secondsOf={secondsOf}
                onLog={(item) => setSheet({ kind: "log", item: { ...item, seconds: secondsOf(item) } })}
              />
            </div>
            <div className="reveal [--i:4] lg:col-span-5">
              <WeekCard week={view.week} todayActual={todayActual} />
            </div>
            <div className="reveal [--i:5] lg:col-span-7">
              <SubjectsCard
                subjects={view.subjects}
                onAdd={() => setSheet({ kind: "subject" })}
                onEdit={(subject) => setSheet({ kind: "subject", subject })}
              />
            </div>
            <div className="reveal [--i:6] lg:col-span-5">
              <TasksCard tasks={view.tasks} onAdd={() => setSheet({ kind: "task" })} />
            </div>
          </>
        )}
      </div>

      {sheet?.kind === "subject" && <SubjectSheet subject={sheet.subject} onClose={() => setSheet(null)} />}
      {sheet?.kind === "log" && <LogTimeSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.kind === "task" && (
        <TaskFormSheet today={todayIso} initial={{ category: "ESTUDIO" }} onClose={() => setSheet(null)} />
      )}
    </>
  );
}
