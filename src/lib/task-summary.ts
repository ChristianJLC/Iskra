import {
  addCalendarDays,
  compareCalendarDates,
  daysInMonth,
  getCalendarWeekday,
  type CalendarDate,
} from "@/lib/date";
import type { TaskPriority } from "@/generated/prisma/client";

export type Tone = "danger" | "warning" | "neutral";

export type TaskCategory = "TRABAJO" | "PERSONAL" | "CASA" | "ESTUDIO" | "SALUD" | "COMPRAS";

export const TASK_CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "TRABAJO", label: "Trabajo" },
  { value: "PERSONAL", label: "Personal" },
  { value: "CASA", label: "Casa" },
  { value: "ESTUDIO", label: "Estudio" },
  { value: "SALUD", label: "Salud" },
  { value: "COMPRAS", label: "Compras" },
];

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
const SHORT_DATE = new Intl.DateTimeFormat("es", { timeZone: "UTC", day: "2-digit", month: "short" });
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Las fechas de vencimiento se guardan como medianoche UTC del día elegido. */
function dueDateToCalendar(date: Date): CalendarDate {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function calendarToIso({ year, month, day }: CalendarDate) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dueDateToIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getTaskDue(date: Date, today: CalendarDate) {
  const diffDays = compareCalendarDates(dueDateToCalendar(date), today) / 86400000;
  if (diffDays < 0) return { text: `Venció ${SHORT_DATE.format(date)}`, rank: 0, tone: "danger" as Tone, diffDays };
  if (diffDays === 0) return { text: "Vence hoy", rank: 1, tone: "warning" as Tone, diffDays };
  if (diffDays === 1) return { text: "Mañana", rank: 2, tone: "neutral" as Tone, diffDays };
  return { text: SHORT_DATE.format(date), rank: 2, tone: "neutral" as Tone, diffDays };
}

export function sortTasksByUrgency<T extends { priority: TaskPriority; dueDate: Date | null }>(
  tasks: T[],
  today: CalendarDate
) {
  return tasks
    .map((task) => ({ ...task, due: task.dueDate ? getTaskDue(task.dueDate, today) : null }))
    .sort(
      (a, b) =>
        (a.due?.rank ?? 2) - (b.due?.rank ?? 2) ||
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
        (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity)
    );
}

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  category?: TaskCategory | null;
  dueDate: Date | null;
  completed: boolean;
};

const GROUPS: { key: string; label: string; matches: (diffDays: number | null) => boolean }[] = [
  { key: "overdue", label: "Vencidas", matches: (d) => d !== null && d < 0 },
  { key: "today", label: "Hoy", matches: (d) => d === 0 },
  { key: "tomorrow", label: "Mañana", matches: (d) => d === 1 },
  { key: "week", label: "Esta semana", matches: (d) => d !== null && d >= 2 && d <= 7 },
  { key: "later", label: "Más adelante", matches: (d) => d !== null && d > 7 },
  { key: "none", label: "Sin fecha", matches: (d) => d === null },
];

export function buildTaskView(today: CalendarDate, tasks: TaskItem[]) {
  const pending = sortTasksByUrgency(tasks.filter((task) => !task.completed), today);
  const completed = tasks.filter((task) => task.completed);
  const count = (matches: (diffDays: number) => boolean) =>
    pending.filter((task) => task.due && matches(task.due.diffDays)).length;

  return {
    focus: pending[0] ?? null,
    next: pending[1] ?? null,
    pending,
    pendingCount: pending.length,
    completedCount: completed.length,
    total: tasks.length,
    overdueCount: count((d) => d < 0),
    todayCount: count((d) => d === 0),
    weekCount: count((d) => d >= 1 && d <= 7),
    groups: GROUPS.map(({ key, label, matches }) => ({
      key,
      label,
      tasks: pending.filter((task) => matches(task.due?.diffDays ?? null)),
    })).filter((group) => group.tasks.length > 0),
    completed,
    areas: TASK_CATEGORY_OPTIONS.map(({ value, label }) => {
      const inArea = tasks.filter((task) => task.category === value);
      return { value, label, total: inArea.length, done: inArea.filter((task) => task.completed).length };
    }).filter((area) => area.total > 0),
  };
}

export type TaskView = ReturnType<typeof buildTaskView>;
export type PendingTask = TaskView["pending"][number];

export function filterTasks(tasks: TaskItem[], category: TaskCategory | null, dayIso: string | null) {
  return tasks.filter(
    (task) =>
      (!category || task.category === category) &&
      (!dayIso || (task.dueDate !== null && dueDateToIso(task.dueDate) === dayIso))
  );
}

function pendingOnDay(pending: PendingTask[], iso: string) {
  return pending.filter((task) => task.dueDate && dueDateToIso(task.dueDate) === iso);
}

export function getWeekStrip(today: CalendarDate, pending: PendingTask[]) {
  return Array.from({ length: 7 }, (_, offset) => {
    const cal = addCalendarDays(today, offset);
    const iso = calendarToIso(cal);
    return {
      iso,
      day: cal.day,
      label: offset === 0 ? "Hoy" : WEEKDAY_SHORT[getCalendarWeekday(cal)],
      isToday: offset === 0,
      tasks: pendingOnDay(pending, iso),
    };
  });
}

export function getMonthGrid(year: number, month: number, pending: PendingTask[]) {
  const first = { year, month, day: 1 };
  const leadingBlanks = (getCalendarWeekday(first) + 6) % 7;

  return {
    leadingBlanks,
    days: Array.from({ length: daysInMonth(month, year) }, (_, i) => {
      const cal = { year, month, day: i + 1 };
      const iso = calendarToIso(cal);
      return { iso, day: i + 1, tasks: pendingOnDay(pending, iso) };
    }),
  };
}
