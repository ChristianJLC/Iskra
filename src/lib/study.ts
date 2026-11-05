import "server-only";
import { prisma } from "@/lib/prisma";
import {
  addCalendarDays,
  calendarDateToUtc,
  endOfToday,
  getMonthBounds,
  getZonedCalendarDate,
  startOfToday,
} from "@/lib/date";
import {
  STUDY_STREAK_LOOKBACK_DAYS,
  buildStudyView,
  getDayItems,
  type StudyEntryInput,
  type StudySubjectInput,
} from "@/lib/study-summary";
import type { StudyEntry, StudySubject } from "@/generated/prisma/client";

type TimerFields = Pick<StudyEntry, "accumulatedSeconds" | "runningSince" | "targetMinutes">;

/**
 * Un temporizador en marcha nunca cuenta más allá de la meta: así uno olvidado
 * (pestaña cerrada, toda la noche) no inventa horas de estudio.
 */
export function effectiveSeconds(entry: TimerFields, now = new Date()): number {
  if (!entry.runningSince) return entry.accumulatedSeconds;
  const elapsed = Math.max(0, Math.floor((now.getTime() - entry.runningSince.getTime()) / 1000));
  const limit = Math.max(entry.accumulatedSeconds, entry.targetMinutes * 60);
  return Math.min(entry.accumulatedSeconds + elapsed, limit);
}

export function effectiveMinutes(entry: TimerFields, now = new Date()): number {
  return Math.floor(effectiveSeconds(entry, now) / 60);
}

/** Datos para detener un temporizador guardando el tiempo que llevaba. */
export function stoppedTimerData(entry: TimerFields, now = new Date()) {
  const accumulatedSeconds = effectiveSeconds(entry, now);
  return {
    accumulatedSeconds,
    runningSince: null,
    completed: accumulatedSeconds >= entry.targetMinutes * 60,
  };
}

/** Cierra los temporizadores que ya llegaron a su meta o que quedaron corriendo de otro día. */
async function settleFinishedTimers(userId: string, timezone: string) {
  const running = await prisma.studyEntry.findMany({ where: { userId, runningSince: { not: null } } });
  const todayStart = startOfToday(timezone);
  const finished = running.filter(
    (entry) => entry.date < todayStart || effectiveSeconds(entry) >= entry.targetMinutes * 60
  );

  await Promise.all(
    finished.map((entry) => prisma.studyEntry.update({ where: { id: entry.id }, data: stoppedTimerData(entry) }))
  );
}

function toSubjectInput(subject: StudySubject, timezone: string): StudySubjectInput {
  return {
    id: subject.id,
    name: subject.name,
    targetMinutes: subject.targetMinutes,
    weekdays: subject.weekdays,
    scheduledFromCal: getZonedCalendarDate(timezone, subject.scheduledFrom),
  };
}

function toEntryInput(entry: StudyEntry, timezone: string): StudyEntryInput {
  return {
    id: entry.id,
    subjectId: entry.subjectId,
    subjectName: entry.subjectName,
    cal: getZonedCalendarDate(timezone, entry.date),
    targetMinutes: entry.targetMinutes,
    seconds: effectiveSeconds(entry),
    running: Boolean(entry.runningSince),
    completed: entry.completed,
  };
}

export async function getStudyView(userId: string, timezone: string) {
  await settleFinishedTimers(userId, timezone);

  const today = getZonedCalendarDate(timezone);
  const since = calendarDateToUtc(timezone, addCalendarDays(today, -STUDY_STREAK_LOOKBACK_DAYS));

  const [subjects, entries, tasks] = await Promise.all([
    prisma.studySubject.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.studyEntry.findMany({ where: { userId, date: { gte: since } }, orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({ where: { userId, completed: false, category: "ESTUDIO" } }),
  ]);

  return buildStudyView({
    today,
    subjects: subjects.map((subject) => toSubjectInput(subject, timezone)),
    entries: entries.map((entry) => toEntryInput(entry, timezone)),
    tasks: tasks.map(({ id, title, priority, dueDate }) => ({ id, title, priority, dueDate })),
  });
}

/** Las metas de estudio de hoy para el Resumen: incluye las materias del plan aún sin empezar. */
export async function getTodayStudyGoals(userId: string, timezone: string) {
  await settleFinishedTimers(userId, timezone);

  const [subjects, entries] = await Promise.all([
    prisma.studySubject.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.studyEntry.findMany({
      where: { userId, date: { gte: startOfToday(timezone), lt: endOfToday(timezone) } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return getDayItems(
    getZonedCalendarDate(timezone),
    subjects.map((subject) => toSubjectInput(subject, timezone)),
    entries.map((entry) => toEntryInput(entry, timezone))
  ).map((item) => ({
    id: item.key,
    name: item.name,
    actualMinutes: Math.floor(item.seconds / 60),
    targetMinutes: item.targetMinutes,
    running: item.running,
    completed: item.done,
  }));
}

export async function getMonthlyStudyCompliance(userId: string, month: number, year: number, timezone: string) {
  const { start, end } = getMonthBounds(timezone, month, year);

  const entries = await prisma.studyEntry.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });

  const totalTarget = entries.reduce((sum, e) => sum + e.targetMinutes, 0);
  const totalActual = entries.reduce((sum, e) => sum + effectiveMinutes(e), 0);
  const completedCount = entries.filter((e) => e.completed).length;

  return {
    entries: entries.length,
    completedCount,
    totalTarget,
    totalActual,
    rate: totalTarget ? Math.min(1, totalActual / totalTarget) : 0,
  };
}

export async function getStudyHistorialMonths(
  userId: string,
  excludeMonth: number,
  excludeYear: number,
  timezone: string
) {
  const entries = await prisma.studyEntry.findMany({
    where: { userId },
    select: { date: true },
  });

  const months = new Map<string, { month: number; year: number }>();
  for (const { date } of entries) {
    const { month, year } = getZonedCalendarDate(timezone, date);
    if (month === excludeMonth && year === excludeYear) continue;
    months.set(`${year}-${month}`, { month, year });
  }

  const results = await Promise.all(
    Array.from(months.values()).map(async ({ month, year }) => ({
      month,
      year,
      ...(await getMonthlyStudyCompliance(userId, month, year, timezone)),
    }))
  );

  return results.sort((a, b) => b.year - a.year || b.month - a.month);
}
