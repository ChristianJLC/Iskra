import "server-only";
import { prisma } from "@/lib/prisma";
import { getMonthBounds, getZonedCalendarDate } from "@/lib/date";
import type { StudyEntry } from "@/generated/prisma/client";

type TimerFields = Pick<StudyEntry, "accumulatedSeconds" | "runningSince">;

export function effectiveSeconds(entry: TimerFields, now = new Date()): number {
  if (!entry.runningSince) return entry.accumulatedSeconds;
  const elapsed = Math.floor((now.getTime() - entry.runningSince.getTime()) / 1000);
  return entry.accumulatedSeconds + Math.max(0, elapsed);
}

export function effectiveMinutes(entry: TimerFields, now = new Date()): number {
  return Math.floor(effectiveSeconds(entry, now) / 60);
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
