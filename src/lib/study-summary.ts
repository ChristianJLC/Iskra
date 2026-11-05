import { addCalendarDays, compareCalendarDates, getCalendarWeekday, type CalendarDate } from "@/lib/date";
import { sortTasksByUrgency } from "@/lib/task-summary";
import type { TaskPriority } from "@/generated/prisma/client";

export const STUDY_STREAK_LOOKBACK_DAYS = 120;

/** Semana de lunes a domingo; `value` usa la misma numeración que Date.getDay(). */
export const WEEKDAYS = [
  { value: 1, short: "L", name: "Lunes" },
  { value: 2, short: "M", name: "Martes" },
  { value: 3, short: "M", name: "Miércoles" },
  { value: 4, short: "J", name: "Jueves" },
  { value: 5, short: "V", name: "Viernes" },
  { value: 6, short: "S", name: "Sábado" },
  { value: 0, short: "D", name: "Domingo" },
];

export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export type StudySubjectInput = {
  id: string;
  name: string;
  targetMinutes: number;
  weekdays: number[];
  scheduledFromCal: CalendarDate;
};

export type StudyEntryInput = {
  id: string;
  subjectId: string | null;
  subjectName: string;
  cal: CalendarDate;
  targetMinutes: number;
  seconds: number;
  running: boolean;
  completed: boolean;
};

export type StudyItem = {
  key: string;
  entryId: string | null;
  subjectId: string | null;
  name: string;
  targetMinutes: number;
  seconds: number;
  running: boolean;
  done: boolean;
  /** Toca por plan ese día. Las sesiones extra suman, pero no romperlas no castiga. */
  required: boolean;
};

const dayKey = ({ year, month, day }: CalendarDate) => `${year}-${month}-${day}`;

/** Lo que tocó un día: sus sesiones registradas más las materias del plan aún sin empezar. */
export function getDayItems(cal: CalendarDate, subjects: StudySubjectInput[], entries: StudyEntryInput[]): StudyItem[] {
  const weekday = getCalendarWeekday(cal);
  const scheduled = subjects.filter(
    (subject) => subject.weekdays.includes(weekday) && compareCalendarDates(subject.scheduledFromCal, cal) <= 0
  );
  const scheduledIds = new Set(scheduled.map((subject) => subject.id));
  const startedIds = new Set(entries.map((entry) => entry.subjectId));

  return [
    ...entries.map((entry) => ({
      key: entry.id,
      entryId: entry.id,
      subjectId: entry.subjectId,
      name: entry.subjectName,
      targetMinutes: entry.targetMinutes,
      seconds: entry.seconds,
      running: entry.running,
      done: entry.completed || entry.seconds >= entry.targetMinutes * 60,
      required: entry.subjectId != null && scheduledIds.has(entry.subjectId),
    })),
    ...scheduled
      .filter((subject) => !startedIds.has(subject.id))
      .map((subject) => ({
        key: `subject-${subject.id}`,
        entryId: null,
        subjectId: subject.id,
        name: subject.name,
        targetMinutes: subject.targetMinutes,
        seconds: 0,
        running: false,
        done: false,
        required: true,
      })),
  ];
}

function sumMinutes(items: { seconds: number }[]) {
  return Math.floor(items.reduce((sum, item) => sum + item.seconds, 0) / 60);
}

/**
 * Un día suma a la racha si se cumplió todo su plan, o si sin plan se completó una sesión extra.
 * Solo lo rompe un día con plan incumplido; hoy nunca lo rompe porque aún está en curso.
 */
export function computeStudyStreak(
  today: CalendarDate,
  subjects: StudySubjectInput[],
  entries: StudyEntryInput[],
  lookbackDays = STUDY_STREAK_LOOKBACK_DAYS
) {
  const byDay = groupByDay(entries);
  let streak = 0;

  for (let offset = 0; offset < lookbackDays; offset++) {
    const cal = addCalendarDays(today, -offset);
    const items = getDayItems(cal, subjects, byDay.get(dayKey(cal)) ?? []);
    const required = items.filter((item) => item.required);
    const planMet = required.every((item) => item.done);

    if (required.length > 0 ? planMet : items.some((item) => item.done)) {
      streak += 1;
    } else if (required.length > 0 && offset > 0) {
      break;
    }
  }

  return streak;
}

function groupByDay(entries: StudyEntryInput[]) {
  const byDay = new Map<string, StudyEntryInput[]>();
  for (const entry of entries) {
    const key = dayKey(entry.cal);
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }
  return byDay;
}

export type StudyWeekDayState = "done" | "partial" | "missed" | "today" | "upcoming" | "free";

function getWeekDayState(position: number, plannedMinutes: number, actualMinutes: number, met: boolean): StudyWeekDayState {
  if (plannedMinutes === 0 && actualMinutes === 0) return "free";
  if (met) return "done";
  if (position === 0) return "today";
  if (position > 0) return "upcoming";
  return actualMinutes > 0 ? "partial" : "missed";
}

export type StudyViewInput = {
  today: CalendarDate;
  subjects: StudySubjectInput[];
  /** Sesiones desde hace STUDY_STREAK_LOOKBACK_DAYS días hasta hoy. */
  entries: StudyEntryInput[];
  tasks: { id: string; title: string; priority: TaskPriority; dueDate: Date | null }[];
};

export function buildStudyView({ today, subjects, entries, tasks }: StudyViewInput) {
  const byDay = groupByDay(entries);
  const subjectOrder = new Map(subjects.map((subject, index) => [subject.id, index]));
  const orderOf = (item: StudyItem) => subjectOrder.get(item.subjectId ?? "") ?? subjects.length;

  const items = getDayItems(today, subjects, byDay.get(dayKey(today)) ?? []).sort(
    (a, b) => Number(a.done) - Number(b.done) || orderOf(a) - orderOf(b)
  );
  const pending = items.filter((item) => !item.done);
  const active =
    pending.find((item) => item.running) ?? pending.find((item) => item.seconds > 0) ?? pending[0] ?? null;
  const afterActive = pending.find((item) => item.key !== active?.key) ?? null;

  const todayIds = new Set(items.map((item) => item.subjectId));
  const others = subjects
    .filter((subject) => !todayIds.has(subject.id))
    .map(({ id, name, targetMinutes }) => ({ id, name, targetMinutes }));

  const weekday = getCalendarWeekday(today);
  const monday = addCalendarDays(today, weekday === 0 ? -6 : 1 - weekday);

  const days = WEEKDAYS.map(({ short, name }, index) => {
    const cal = addCalendarDays(monday, index);
    const position = compareCalendarDates(cal, today);
    const dayItems = getDayItems(cal, subjects, byDay.get(dayKey(cal)) ?? []);
    const required = dayItems.filter((item) => item.required);
    const plannedMinutes = dayItems.reduce((sum, item) => sum + item.targetMinutes, 0);
    const actualMinutes = sumMinutes(dayItems);
    const met = required.length > 0 ? required.every((item) => item.done) : dayItems.some((item) => item.done);

    return {
      key: dayKey(cal),
      short,
      name,
      isToday: position === 0,
      isPast: position < 0,
      plannedMinutes,
      actualMinutes,
      state: getWeekDayState(position, plannedMinutes, actualMinutes, met),
    };
  });

  const weekDayKeys = new Set(days.map((day) => day.key));
  const monthEntries = entries.filter((entry) => entry.cal.year === today.year && entry.cal.month === today.month);
  const nextOffset = Array.from({ length: 7 }, (_, i) => i + 1).find((offset) =>
    subjects.some((subject) => subject.weekdays.includes(getCalendarWeekday(addCalendarDays(today, offset))))
  );

  const next = nextOffset
    ? (() => {
        const cal = addCalendarDays(today, nextOffset);
        const dayNumber = getCalendarWeekday(cal);
        const nextSubjects = subjects.filter((subject) => subject.weekdays.includes(dayNumber));
        return {
          when: nextOffset === 1 ? "Mañana" : WEEKDAYS.find(({ value }) => value === dayNumber)!.name,
          label: nextSubjects.map((subject) => subject.name).join(", "),
          minutes: nextSubjects.reduce((sum, subject) => sum + subject.targetMinutes, 0),
        };
      })()
    : null;

  return {
    hasSubjects: subjects.length > 0,
    hasPlan: subjects.some((subject) => subject.weekdays.length > 0),
    firstUnscheduledId: subjects.find((subject) => subject.weekdays.length === 0)?.id ?? null,
    items,
    activeKey: active?.key ?? null,
    afterActive: afterActive && { name: afterActive.name, targetMinutes: afterActive.targetMinutes },
    others,
    next,
    streak: computeStudyStreak(today, subjects, entries),
    week: {
      days,
      plannedMinutes: days.reduce((sum, day) => sum + day.plannedMinutes, 0),
      actualMinutes: days.reduce((sum, day) => sum + day.actualMinutes, 0),
      /** Lo que quedó sin hacer en días ya pasados: hoy todavía puede cumplirse. */
      behindMinutes: days
        .filter((day) => day.isPast)
        .reduce((sum, day) => sum + Math.max(day.plannedMinutes - day.actualMinutes, 0), 0),
    },
    month: {
      minutes: sumMinutes(monthEntries),
      daysStudied: new Set(monthEntries.filter((entry) => entry.seconds > 0).map((entry) => dayKey(entry.cal))).size,
    },
    subjects: subjects.map((subject) => {
      const own = entries.filter((entry) => entry.subjectId === subject.id);
      return {
        id: subject.id,
        name: subject.name,
        targetMinutes: subject.targetMinutes,
        weekdays: subject.weekdays,
        weekMinutes: sumMinutes(own.filter((entry) => weekDayKeys.has(dayKey(entry.cal)))),
        weekPlannedMinutes: subject.targetMinutes * subject.weekdays.length,
        monthMinutes: sumMinutes(own.filter((entry) => entry.cal.year === today.year && entry.cal.month === today.month)),
      };
    }),
    tasks: sortTasksByUrgency(tasks, today).map(({ id, title, due }) => ({
      id,
      title,
      dueText: due?.text ?? null,
      dueTone: due?.tone ?? ("neutral" as const),
    })),
  };
}

export type StudyView = ReturnType<typeof buildStudyView>;
export type StudySubjectView = StudyView["subjects"][number];
