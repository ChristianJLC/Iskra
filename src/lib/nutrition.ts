import "server-only";
import { prisma } from "@/lib/prisma";
import { getZonedCalendarDate, calendarDateToUtc, addCalendarDays, endOfToday, type CalendarDate } from "@/lib/date";

const STREAK_LOOKBACK_DAYS = 120;

function calendarKey(cal: CalendarDate) {
  return `${cal.year}-${cal.month}-${cal.day}`;
}

export async function getNutritionStreak(userId: string, timezone: string) {
  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!profile?.completedAt || profile.targetCalorieMin == null || profile.targetCalorieMax == null) {
    return 0;
  }
  const { targetCalorieMin, targetCalorieMax } = profile;

  const todayCal = getZonedCalendarDate(timezone);
  const lookbackStart = calendarDateToUtc(timezone, addCalendarDays(todayCal, -STREAK_LOOKBACK_DAYS));

  const meals = await prisma.mealEntry.findMany({
    where: { userId, date: { gte: lookbackStart, lt: endOfToday(timezone) } },
    select: { date: true, calories: true, completed: true },
  });

  const byDay = new Map<string, { calories: number; allCompleted: boolean }>();
  for (const meal of meals) {
    const key = calendarKey(getZonedCalendarDate(timezone, meal.date));
    const day = byDay.get(key) ?? { calories: 0, allCompleted: true };
    day.calories += meal.calories ?? 0;
    day.allCompleted = day.allCompleted && meal.completed;
    byDay.set(key, day);
  }

  let streak = 0;
  let cursorCal = todayCal;

  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const day = byDay.get(calendarKey(cursorCal));
    const isToday = i === 0;
    const dayOk =
      Boolean(day) &&
      day!.allCompleted &&
      day!.calories >= targetCalorieMin &&
      day!.calories <= targetCalorieMax;

    if (dayOk) {
      streak += 1;
    } else if (!isToday) {
      break;
    }

    cursorCal = addCalendarDays(cursorCal, -1);
  }

  return streak;
}
