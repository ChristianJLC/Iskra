import "server-only";
import { prisma } from "@/lib/prisma";
import { getMonthBounds, getWeekBounds, getWeekdayKey } from "@/lib/date";
import type { MuscleGroup, WorkoutSchedule } from "@/generated/prisma/client";

export { MUSCLE_GROUP_LABELS, formatMuscleGroups } from "@/lib/routine-groups";

export function getScheduledGroups(schedule: WorkoutSchedule | null, date: Date): MuscleGroup[] {
  if (!schedule) return [];
  return schedule[getWeekdayKey(date)];
}

function eachDateOfMonth(month: number, year: number) {
  const { start, end } = getMonthBounds(month, year);
  const dates: Date[] = [];
  for (let d = start; d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    dates.push(d);
  }
  return dates;
}

export async function getCurrentWeekView(userId: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const { start, end } = getWeekBounds(new Date());

  const completions = await prisma.workoutCompletion.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });
  const completedDates = new Set(completions.map((c) => c.date.getTime()));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  return days.map((date) => ({
    date,
    groups: getScheduledGroups(schedule, date),
    completed: completedDates.has(date.getTime()),
  }));
}

export async function getTodayWorkout(userId: string) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const groups = getScheduledGroups(schedule, dayStart);

  const completion = await prisma.workoutCompletion.findUnique({
    where: { userId_date: { userId, date: dayStart } },
  });

  return { groups, completed: Boolean(completion) };
}

export async function getMonthlyCompliance(userId: string, month: number, year: number) {
  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId } });
  const { start, end } = getMonthBounds(month, year);

  const scheduled = eachDateOfMonth(month, year).filter(
    (date) => getScheduledGroups(schedule, date).length > 0
  ).length;

  const completed = await prisma.workoutCompletion.count({
    where: { userId, date: { gte: start, lt: end } },
  });

  return { scheduled, completed, rate: scheduled ? completed / scheduled : 0 };
}

export async function getExerciseHistorialMonths(userId: string, excludeMonth: number, excludeYear: number) {
  const completions = await prisma.workoutCompletion.findMany({
    where: { userId },
    select: { date: true },
  });

  const months = new Map<string, { month: number; year: number }>();
  for (const { date } of completions) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month === excludeMonth && year === excludeYear) continue;
    months.set(`${year}-${month}`, { month, year });
  }

  const results = await Promise.all(
    Array.from(months.values()).map(async ({ month, year }) => ({
      month,
      year,
      ...(await getMonthlyCompliance(userId, month, year)),
    }))
  );

  return results.sort((a, b) => b.year - a.year || b.month - a.month);
}
