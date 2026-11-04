"use client";

import { useMemo, useState, useTransition } from "react";
import { MotionConfig } from "framer-motion";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { deleteTask, toggleTask } from "@/actions/tasks";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DeleteButton } from "@/components/delete-button";
import { TaskDoneButton } from "@/components/task-done-button";
import { AREA_ICONS, TaskFormSheet, TaskQuickAdd, type TaskFormValues } from "@/components/task-form";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { cn } from "@/lib/cn";
import {
  TASK_CATEGORY_OPTIONS,
  buildTaskView,
  calendarToIso,
  dueDateToIso,
  filterTasks,
  getMonthGrid,
  getWeekStrip,
  type PendingTask,
  type TaskCategory,
  type TaskItem,
  type TaskView,
  type Tone,
} from "@/lib/task-summary";
import type { CalendarDate } from "@/lib/date";

const HERO_PRIMARY = "bg-white text-[#14141a] hover:bg-white/90";
const HERO_SECONDARY = "bg-white/10 text-white hover:bg-white/15";

const HERO_EMBERS = [
  { left: "58%", drift: "14px", duration: "5s", delay: "0s" },
  { left: "68%", drift: "-12px", duration: "6.5s", delay: "1.4s" },
  { left: "76%", drift: "18px", duration: "5.5s", delay: "2.6s" },
  { left: "86%", drift: "-16px", duration: "7s", delay: "0.8s" },
  { left: "94%", drift: "10px", duration: "6s", delay: "3.4s" },
];

const SPARKS = [
  { dx: "-16px", dy: "-14px" },
  { dx: "0px", dy: "-20px" },
  { dx: "16px", dy: "-14px" },
  { dx: "19px", dy: "4px" },
  { dx: "-19px", dy: "4px" },
  { dx: "0px", dy: "18px" },
];

const TONE_TEXT: Record<Tone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-muted",
};

const HERO_TONE: Record<Tone, string> = {
  danger: "text-[#fb7185]",
  warning: "text-[#fbbf24]",
  neutral: "text-white/60",
};

const CATEGORY_LABELS = Object.fromEntries(TASK_CATEGORY_OPTIONS.map(({ value, label }) => [value, label])) as Record<
  TaskCategory,
  string
>;

type ViewMode = "LISTA" | "CALENDARIO";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "LISTA", label: "Lista" },
  { value: "CALENDARIO", label: "Calendario" },
];

const MONTH_LABEL = new Intl.DateTimeFormat("es", { timeZone: "UTC", month: "long", year: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat("es", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isoToLabel(iso: string) {
  return capitalize(DAY_LABEL.format(new Date(`${iso}T00:00:00Z`)));
}

function toFormValues(task: PendingTask): TaskFormValues {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    date: task.dueDate ? dueDateToIso(task.dueDate) : "",
    priority: task.priority,
    category: task.category ?? null,
  };
}

function FocusHero({ view, onAdd }: { view: TaskView; onAdd: () => void }) {
  const { focus, next } = view;
  const allDone = !focus && view.completedCount > 0;

  return (
    <div className="relative flex h-full min-h-72 flex-col justify-between gap-8 overflow-hidden rounded-3xl border border-white/10 bg-[#14141a] p-6 text-white shadow-soft sm:p-8">
      <div aria-hidden="true" className="hero-hearth pointer-events-none absolute inset-0" />
      {allDone && (
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

      <div className="relative min-w-0">
        {focus ? (
          <>
            <p className="text-sm font-medium text-white/60">Lo primero</p>
            <h2 className="mt-2 line-clamp-2 text-4xl leading-tight font-semibold tracking-tight break-words sm:text-5xl">
              {focus.title}
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {focus.due && (
                <span className={cn("flex items-center gap-1.5 font-medium", HERO_TONE[focus.due.tone])}>
                  <CalendarDays className="size-4" />
                  {focus.due.text}
                </span>
              )}
              {focus.priority === "ALTA" && <span className="font-medium text-[#fb7185]">Prioridad alta</span>}
              {focus.category && <span className="text-white/60">{CATEGORY_LABELS[focus.category]}</span>}
            </p>
          </>
        ) : allDone ? (
          <>
            <p className="text-sm font-medium text-white/60">Tus tareas</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Todo al día</h2>
            <p className="mt-3 text-sm text-white/60">Terminaste todo lo que tenías pendiente.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-white/60">Tus tareas</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Empieza tu lista</h2>
            <p className="mt-3 max-w-md text-sm text-white/60">
              Saca de tu cabeza lo que tienes pendiente y aquí verás qué hacer primero.
            </p>
          </>
        )}
      </div>

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex">
          {focus && <TaskDoneButton id={focus.id} />}
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium whitespace-nowrap transition-colors",
              focus ? HERO_SECONDARY : HERO_PRIMARY
            )}
          >
            <Plus className="size-4" />
            Agregar tarea
          </button>
        </div>
        {next && (
          <p className="min-w-0 truncate text-sm text-white/60">
            Después: <span className="font-medium text-white">{next.title}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <Card className="flex flex-col justify-between gap-2 rounded-3xl p-4 sm:p-5">
      <h2 className="truncate text-sm font-medium text-muted">{label}</h2>
      <p className={cn("text-3xl font-semibold tracking-tight", danger && value > 0 ? "text-danger" : "text-foreground")}>
        <CountUp value={value} />
      </p>
    </Card>
  );
}

function StatsColumn({ view }: { view: TaskView }) {
  return (
    <div className="grid h-full grid-cols-3 gap-4">
      <Card className="col-span-3 flex items-center gap-5 rounded-3xl">
        <ProgressRing percent={(view.completedCount / view.total) * 100} size={96} strokeWidth={10}>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            <CountUp value={view.completedCount} />
            <span className="text-sm text-muted">/{view.total}</span>
          </p>
        </ProgressRing>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted">Tu avance</h2>
          <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            {view.pendingCount === 0
              ? "Terminaste todo"
              : `${view.pendingCount === 1 ? "Te falta" : "Te faltan"} ${view.pendingCount}`}
          </p>
        </div>
      </Card>
      <StatTile label="Vencidas" value={view.overdueCount} danger />
      <StatTile label="Hoy" value={view.todayCount} />
      <StatTile label="Semana" value={view.weekCount} />
    </div>
  );
}

function AreaStarter({ onPick }: { onPick: (category: TaskCategory) => void }) {
  return (
    <Card className="flex h-full flex-col gap-4 rounded-3xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">¿Por dónde empiezas?</h2>
        <p className="text-sm text-muted">Elige un área y anota lo primero que se te venga a la mente.</p>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
        {TASK_CATEGORY_OPTIONS.map(({ value, label }) => {
          const Icon = AREA_ICONS[value];
          return (
            <button
              key={value}
              type="button"
              onClick={() => onPick(value)}
              className="group flex min-h-20 flex-col justify-between gap-2 rounded-2xl bg-surface-2 p-3 text-left transition duration-200 hover:bg-surface-hover motion-safe:hover:-translate-y-[3px]"
            >
              <Icon className="size-5 text-muted transition-colors group-hover:text-accent" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeekStrip({
  days,
  selected,
  onSelect,
  onShowMonth,
}: {
  days: ReturnType<typeof getWeekStrip>;
  selected: string | null;
  onSelect: (iso: string) => void;
  onShowMonth: () => void;
}) {
  return (
    <Card className="rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Tus próximos 7 días</h2>
        <button
          type="button"
          onClick={onShowMonth}
          className="-mr-1.5 flex items-center gap-0.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Ver el mes
          <ChevronRight className="size-4" />
        </button>
      </div>

      <ul className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const active = selected === day.iso;
          const count = day.tasks.length;
          return (
            <li key={day.iso}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${day.label} ${day.day}: ${count} ${count === 1 ? "tarea" : "tareas"}`}
                onClick={() => onSelect(day.iso)}
                className={cn(
                  "flex h-full min-h-24 w-full flex-col items-center gap-1 rounded-2xl px-1 py-3 transition duration-200 motion-safe:hover:-translate-y-[3px] xl:min-h-32 xl:items-start xl:px-3",
                  active
                    ? "bg-foreground text-background shadow-soft"
                    : day.isToday
                      ? "bg-accent/10 text-foreground hover:bg-accent/15"
                      : "bg-surface-2 text-foreground hover:bg-surface-hover"
                )}
              >
                <span className={cn("text-xs font-medium", active ? "text-background/70" : "text-muted")}>{day.label}</span>
                <span className="text-xl font-semibold tracking-tight tabular-nums">{day.day}</span>

                <span className="mt-auto flex h-2 items-center gap-0.5 xl:hidden">
                  {day.tasks.slice(0, 3).map((task) => (
                    <span key={task.id} className={cn("size-1.5 rounded-full", active ? "bg-[var(--ember)]" : "bg-accent")} />
                  ))}
                </span>

                <span className="mt-auto hidden w-full min-w-0 space-y-0.5 text-left xl:block">
                  {day.tasks.slice(0, 2).map((task) => (
                    <span key={task.id} className={cn("block truncate text-xs", active ? "text-background/80" : "text-muted")}>
                      {task.title}
                    </span>
                  ))}
                  {count > 2 && (
                    <span className={cn("block text-xs font-medium", active ? "text-background" : "text-foreground")}>
                      +{count - 2} más
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function TaskRow({ task, onEdit }: { task: PendingTask; onEdit: (task: PendingTask) => void }) {
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();

  function complete() {
    setDone(true);
    startTransition(() => toggleTask(task.id, true));
  }

  const hasPriorityTag = task.priority !== "MEDIA";

  return (
    <li className={cn("flex items-center gap-3 py-2.5 transition-opacity duration-300 last:pb-0", done && "opacity-60")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Marcar como hecha: ${task.title}`}
        disabled={done}
        onClick={complete}
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
          done ? "border-transparent bg-accent text-accent-foreground" : "border-border bg-surface hover:border-accent"
        )}
      >
        {done && (
          <>
            <Check className="size-4" strokeWidth={3} />
            {SPARKS.map(({ dx, dy }) => (
              <span
                key={`${dx}${dy}`}
                aria-hidden="true"
                className="spark pointer-events-none absolute size-1 rounded-full bg-[var(--ember)]"
                style={{ "--dx": dx, "--dy": dy } as React.CSSProperties}
              />
            ))}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={`Editar: ${task.title}`}
        className="group min-w-0 flex-1 rounded-lg text-left"
      >
        <span
          className={cn(
            "block truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent",
            done && "line-through"
          )}
        >
          {task.title}
        </span>
        {(task.due || hasPriorityTag || task.category || task.description) && (
          <span className="block truncate text-xs text-muted">
            {[
              task.due && <span className={TONE_TEXT[task.due.tone]}>{task.due.text}</span>,
              task.priority === "ALTA" && <span className="font-medium text-danger">Alta</span>,
              task.priority === "BAJA" && "Baja",
              task.category && CATEGORY_LABELS[task.category],
              task.description,
            ]
              .filter(Boolean)
              .map((part, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {part}
                </span>
              ))}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-label={`Editar ${task.title}`}
        onClick={() => onEdit(task)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <DeleteButton action={deleteTask.bind(null, task.id)} />
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-foreground text-background" : "bg-surface-2 text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PendingCard({
  allPending,
  filtered,
  category,
  day,
  onCategory,
  onClearDay,
  onEdit,
  onMore,
}: {
  allPending: PendingTask[];
  filtered: TaskView;
  category: TaskCategory | null;
  day: string | null;
  onCategory: (category: TaskCategory | null) => void;
  onClearDay: () => void;
  onEdit: (task: PendingTask) => void;
  onMore: (title: string, clear: () => void) => void;
}) {
  const hasFilter = Boolean(category || day);

  return (
    <Card className="h-full space-y-4 rounded-3xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Pendientes</h2>
        {filtered.pendingCount > 0 && <p className="text-xs text-muted tabular-nums">{filtered.pendingCount}</p>}
      </div>

      <div className="space-y-2">
        <TaskQuickAdd date={day} category={category} onMore={onMore} />
        {hasFilter && (
          <p className="text-xs text-muted">
            Lo que agregues irá a{" "}
            <span className="font-medium text-foreground">
              {[day && isoToLabel(day), category && CATEGORY_LABELS[category]].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        <FilterChip active={!category} onClick={() => onCategory(null)}>
          Todas
        </FilterChip>
        {TASK_CATEGORY_OPTIONS.map(({ value, label }) => {
          const Icon = AREA_ICONS[value];
          const count = allPending.filter((task) => task.category === value).length;
          return (
            <FilterChip key={value} active={category === value} onClick={() => onCategory(category === value ? null : value)}>
              <Icon className="size-3.5" />
              {label}
              {count > 0 && <span className="text-xs tabular-nums opacity-70">{count}</span>}
            </FilterChip>
          );
        })}
      </div>

      {day && (
        <button
          type="button"
          onClick={onClearDay}
          className="flex items-center gap-1.5 rounded-full bg-accent/10 py-1 pr-2 pl-3 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
        >
          {isoToLabel(day)}
          <X className="size-3.5" />
          <span className="sr-only">Quitar filtro de día</span>
        </button>
      )}

      {filtered.groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          {hasFilter
            ? "No tienes tareas aquí. Agrega una arriba."
            : allPending.length === 0
              ? "Escribe tu primera tarea aquí arriba."
              : "No tienes tareas pendientes."}
        </p>
      ) : (
        <div className="space-y-5">
          {filtered.groups.map((group) => (
            <section key={group.key}>
              <h3 className={cn("text-xs font-semibold", group.key === "overdue" ? "text-danger" : "text-foreground")}>
                {group.label}
              </h3>
              <ul className="mt-1 divide-y divide-border/70">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onEdit={onEdit} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

function AreasCard({
  view,
  active,
  onSelect,
}: {
  view: TaskView;
  active: TaskCategory | null;
  onSelect: (category: TaskCategory | null) => void;
}) {
  return (
    <Card className="space-y-3 rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Por área</h2>
      <ul className="space-y-1">
        {view.areas.map(({ value, label, total, done }) => {
          const Icon = AREA_ICONS[value];
          return (
            <li key={value}>
              <button
                type="button"
                aria-pressed={active === value}
                onClick={() => onSelect(active === value ? null : value)}
                className={cn(
                  "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-hover",
                  active === value && "bg-surface-2"
                )}
              >
                <Icon className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-foreground">{label}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {done}/{total}
                    </span>
                  </span>
                  <ProgressBar percent={(done / total) * 100} className="mt-1.5 h-1.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function CompletedCard({ view }: { view: TaskView }) {
  return (
    <Card className="space-y-2 rounded-3xl">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Completadas</h2>
        {view.completedCount > 0 && <p className="text-xs text-muted tabular-nums">{view.completedCount}</p>}
      </div>

      {view.completed.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Las tareas que termines aparecerán aquí.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-border/70 overflow-y-auto">
          {view.completed.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2.5">
              <ToggleCheckbox
                checked
                label={`Volver a pendientes: ${task.title}`}
                className="size-8 rounded-xl shadow-none!"
                action={toggleTask.bind(null, task.id, false)}
              />
              <p className="min-w-0 flex-1 truncate text-sm text-muted line-through">{task.title}</p>
              <DeleteButton action={deleteTask.bind(null, task.id)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MonthCard({
  today,
  pending,
  selected,
  onSelect,
}: {
  today: CalendarDate;
  pending: PendingTask[];
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const grid = useMemo(() => getMonthGrid(cursor.year, cursor.month, pending), [cursor, pending]);
  const todayIso = calendarToIso(today);

  function move(delta: number) {
    setCursor(({ year, month }) => {
      const index = year * 12 + (month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  }

  return (
    <Card className="rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {capitalize(MONTH_LABEL.format(new Date(Date.UTC(cursor.year, cursor.month - 1, 1))))}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => move(-1)}
            className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => move(1)}
            className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted sm:gap-1.5">
        {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: grid.leadingBlanks }, (_, i) => (
          <span key={i} />
        ))}
        {grid.days.map((day) => {
          const active = selected === day.iso;
          const isToday = day.iso === todayIso;
          const overdue = day.iso < todayIso && day.tasks.length > 0;
          return (
            <button
              key={day.iso}
              type="button"
              aria-pressed={active}
              aria-label={`${isoToLabel(day.iso)}: ${day.tasks.length} ${day.tasks.length === 1 ? "tarea" : "tareas"}`}
              onClick={() => onSelect(day.iso)}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center gap-1 rounded-xl p-1.5 transition-colors sm:min-h-20 lg:items-start",
                active
                  ? "bg-foreground text-background shadow-soft"
                  : isToday
                    ? "bg-accent/10 text-foreground hover:bg-accent/15"
                    : "bg-surface-2 text-foreground hover:bg-surface-hover"
              )}
            >
              <span className={cn("text-sm font-medium tabular-nums", isToday && !active && "text-accent")}>{day.day}</span>

              <span className="flex items-center gap-0.5 lg:hidden">
                {day.tasks.slice(0, 3).map((task) => (
                  <span
                    key={task.id}
                    className={cn("size-1.5 rounded-full", overdue ? "bg-danger" : active ? "bg-[var(--ember)]" : "bg-accent")}
                  />
                ))}
              </span>

              <span className="hidden w-full min-w-0 space-y-0.5 text-left lg:block">
                {day.tasks.slice(0, 2).map((task) => (
                  <span
                    key={task.id}
                    className={cn(
                      "block truncate text-[11px] leading-tight",
                      active ? "text-background/80" : overdue ? "text-danger" : "text-muted"
                    )}
                  >
                    {task.title}
                  </span>
                ))}
                {day.tasks.length > 2 && (
                  <span className={cn("block text-[11px] font-medium", active ? "text-background" : "text-foreground")}>
                    +{day.tasks.length - 2}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function DayPanel({
  iso,
  tasks,
  onAdd,
  onEdit,
}: {
  iso: string;
  tasks: PendingTask[];
  onAdd: () => void;
  onEdit: (task: PendingTask) => void;
}) {
  return (
    <Card className="flex h-full flex-col gap-3 rounded-3xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{isoToLabel(iso)}</h2>
        <p className="text-sm text-muted">
          {tasks.length === 0 ? "Sin tareas para este día" : `${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"}`}
        </p>
      </div>

      {tasks.length > 0 && (
        <ul className="divide-y divide-border/70">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={onEdit} />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Agregar para este día
      </button>
    </Card>
  );
}

type SheetState = { initial: TaskFormValues; onSaved?: () => void } | null;

export function TaskDashboard({
  tasks,
  today,
  dateLabel,
}: {
  tasks: TaskItem[];
  today: CalendarDate;
  dateLabel: string;
}) {
  const [mode, setMode] = useState<ViewMode>("LISTA");
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [calendarDay, setCalendarDay] = useState(() => calendarToIso(today));
  const [sheet, setSheet] = useState<SheetState>(null);

  const todayIso = calendarToIso(today);
  const view = useMemo(() => buildTaskView(today, tasks), [today, tasks]);
  const filtered = useMemo(() => buildTaskView(today, filterTasks(tasks, category, day)), [today, tasks, category, day]);
  const week = useMemo(() => getWeekStrip(today, view.pending), [today, view.pending]);
  const calendarTasks = view.pending.filter((task) => task.dueDate && dueDateToIso(task.dueDate) === calendarDay);
  const hasTasks = view.total > 0;
  const onEdit = (task: PendingTask) => setSheet({ initial: toFormValues(task) });

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="reveal flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Organización</h1>
            <p className="text-sm text-muted">{dateLabel}</p>
          </div>
          <SegmentedControl
            layoutId="task-view-mode"
            options={VIEW_OPTIONS}
            value={mode}
            onChange={setMode}
            className="w-full sm:w-56"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="reveal [--i:1] lg:col-span-7">
            <FocusHero view={view} onAdd={() => setSheet({ initial: {} })} />
          </div>
          <div className="reveal [--i:2] lg:col-span-5">
            {hasTasks ? (
              <StatsColumn view={view} />
            ) : (
              <AreaStarter onPick={(picked) => setSheet({ initial: { category: picked } })} />
            )}
          </div>

          {mode === "LISTA" ? (
            <>
              <div className="reveal [--i:3] lg:col-span-12">
                <WeekStrip
                  days={week}
                  selected={day}
                  onSelect={(iso) => setDay((current) => (current === iso ? null : iso))}
                  onShowMonth={() => setMode("CALENDARIO")}
                />
              </div>
              <div className={cn("reveal [--i:4]", hasTasks ? "lg:col-span-7" : "lg:col-span-12")}>
                <PendingCard
                  allPending={view.pending}
                  filtered={filtered}
                  category={category}
                  day={day}
                  onCategory={setCategory}
                  onClearDay={() => setDay(null)}
                  onEdit={onEdit}
                  onMore={(title, clear) =>
                    setSheet({ initial: { title, date: day ?? "", category }, onSaved: clear })
                  }
                />
              </div>
              {hasTasks && (
                <div className="reveal space-y-4 [--i:5] lg:col-span-5">
                  {view.areas.length > 0 && <AreasCard view={view} active={category} onSelect={setCategory} />}
                  <CompletedCard view={view} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="reveal [--i:3] lg:col-span-8">
                <MonthCard today={today} pending={view.pending} selected={calendarDay} onSelect={setCalendarDay} />
              </div>
              <div className="reveal [--i:4] lg:col-span-4">
                <DayPanel
                  iso={calendarDay}
                  tasks={calendarTasks}
                  onEdit={onEdit}
                  onAdd={() => setSheet({ initial: { date: calendarDay } })}
                />
              </div>
            </>
          )}
        </div>

        {sheet && (
          <TaskFormSheet
            today={todayIso}
            initial={sheet.initial}
            onSaved={sheet.onSaved}
            onClose={() => setSheet(null)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
