import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getMonthBounds,
  getWeekBounds,
  getWeekdayKey,
  getZonedCalendarDate,
  calendarDateToUtc,
  addCalendarDays,
  daysInMonth,
  type CalendarDate,
} from "@/lib/date";
import type { MuscleGroup, WorkoutSchedule } from "@/generated/prisma/client";

export { MUSCLE_GROUP_LABELS, formatMuscleGroups } from "@/lib/routine-groups";

export function getScheduledGroups(schedule: WorkoutSchedule | null, cal: CalendarDate): MuscleGroup[] {
  if (!schedule) return [];
  return schedule[getWeekdayKey(cal)];
}

function eachCalendarDateOfMonth(month: number, year: number): CalendarDate[] {
  const total = daysInMonth(month, year);
  return Array.from({ length: total }, (_, i) => ({ year, month, day: i + 1 }));
}

export async function getCurrentWeekView(userId: string, timezone: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const { start, end } = getWeekBounds(timezone, new Date());
  const startCal = getZonedCalendarDate(timezone, start);

  const completions = await prisma.workoutCompletion.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });
  const completedDates = new Set(completions.map((c) => c.date.getTime()));

  const days: CalendarDate[] = Array.from({ length: 7 }, (_, i) => addCalendarDays(startCal, i));

  return days.map((cal) => {
    const date = calendarDateToUtc(timezone, cal);
    return {
      cal,
      date,
      groups: getScheduledGroups(schedule, cal),
      completed: completedDates.has(date.getTime()),
    };
  });
}

export async function getTodayWorkout(userId: string, timezone: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const cal = getZonedCalendarDate(timezone);
  const groups = getScheduledGroups(schedule, cal);
  const date = calendarDateToUtc(timezone, cal);

  const completion = await prisma.workoutCompletion.findUnique({
    where: { userId_date: { userId, date } },
  });

  return { groups, completed: Boolean(completion) };
}

const STREAK_LOOKBACK_DAYS = 120;

export async function getWorkoutStreak(userId: string, timezone: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const todayCal = getZonedCalendarDate(timezone);
  const todayStart = calendarDateToUtc(timezone, todayCal);
  const lookbackStart = calendarDateToUtc(timezone, addCalendarDays(todayCal, -STREAK_LOOKBACK_DAYS));

  const completions = await prisma.workoutCompletion.findMany({
    where: { userId, date: { gte: lookbackStart, lte: todayStart } },
    select: { date: true },
  });
  const completedDates = new Set(completions.map((c) => c.date.getTime()));

  let streak = 0;
  let cursorCal = todayCal;

  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const groups = getScheduledGroups(schedule, cursorCal);
    const isRestDay = groups.length === 0;
    const isToday = i === 0;
    const cursorDate = calendarDateToUtc(timezone, cursorCal);

    if (!isRestDay) {
      if (completedDates.has(cursorDate.getTime())) {
        streak += 1;
      } else if (!isToday) {
        break;
      }
    }

    cursorCal = addCalendarDays(cursorCal, -1);
  }

  return streak;
}

export async function getMonthlyCompliance(userId: string, month: number, year: number, timezone: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const { start, end } = getMonthBounds(timezone, month, year);

  const scheduled = eachCalendarDateOfMonth(month, year).filter(
    (cal) => getScheduledGroups(schedule, cal).length > 0
  ).length;

  const completed = await prisma.workoutCompletion.count({
    where: { userId, date: { gte: start, lt: end } },
  });

  return { scheduled, completed, rate: scheduled ? completed / scheduled : 0 };
}

export async function getExerciseHistorialMonths(
  userId: string,
  excludeMonth: number,
  excludeYear: number,
  timezone: string
) {
  const completions = await prisma.workoutCompletion.findMany({
    where: { userId },
    select: { date: true },
  });

  const months = new Map<string, { month: number; year: number }>();
  for (const { date } of completions) {
    const cal = getZonedCalendarDate(timezone, date);
    if (cal.month === excludeMonth && cal.year === excludeYear) continue;
    months.set(`${cal.year}-${cal.month}`, { month: cal.month, year: cal.year });
  }

  const results = await Promise.all(
    Array.from(months.values()).map(async ({ month, year }) => ({
      month,
      year,
      ...(await getMonthlyCompliance(userId, month, year, timezone)),
    }))
  );

  return results.sort((a, b) => b.year - a.year || b.month - a.month);
}
