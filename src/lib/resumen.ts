import "server-only";
import { prisma } from "@/lib/prisma";
import { endOfToday, formatMonthYearEs, getMonthBounds, getZonedCalendarDate, startOfToday } from "@/lib/date";
import { getCurrentWeekView, getWorkoutStreak } from "@/lib/exercise";
import { getBillsWithState, getMonthTotals } from "@/lib/finance";
import { getNutritionStreak } from "@/lib/nutrition";
import { buildResumen } from "@/lib/resumen-summary";
import { getTodayStudyGoals } from "@/lib/study";
import { getTodayGlasses } from "@/lib/water";

export async function getResumen(userId: string, timezone: string) {
  const today = getZonedCalendarDate(timezone);
  const todayRange = { gte: startOfToday(timezone), lt: endOfToday(timezone) };
  const { start: monthStart, end: monthEnd } = getMonthBounds(timezone, today.month, today.year);

  const [profile, meals, glasses, nutritionStreak, week, workoutStreak, studies, tasks, entries, bills] =
    await Promise.all([
      prisma.nutritionProfile.findUnique({ where: { userId } }),
      prisma.mealEntry.findMany({ where: { userId, date: todayRange } }),
      getTodayGlasses(userId, timezone),
      getNutritionStreak(userId, timezone),
      getCurrentWeekView(userId, timezone),
      getWorkoutStreak(userId, timezone),
      getTodayStudyGoals(userId, timezone),
      prisma.task.findMany({ where: { userId, completed: false } }),
      prisma.financeEntry.findMany({ where: { userId, date: { gte: monthStart, lt: monthEnd } } }),
      getBillsWithState(userId, timezone),
    ]);

  const target =
    profile?.targetCalories != null &&
    profile.targetCalorieMin != null &&
    profile.targetCalorieMax != null &&
    profile.targetProteinG != null &&
    profile.targetCarbsG != null &&
    profile.targetFatG != null
      ? {
          calories: profile.targetCalories,
          calorieMin: profile.targetCalorieMin,
          calorieMax: profile.targetCalorieMax,
          proteinG: profile.targetProteinG,
          carbsG: profile.targetCarbsG,
          fatG: profile.targetFatG,
        }
      : null;

  return buildResumen({
    today,
    nutrition: {
      configured: Boolean(profile?.completedAt),
      calories: Math.round(meals.reduce((sum, m) => sum + (m.calories ?? 0), 0)),
      proteinG: meals.reduce((sum, m) => sum + (m.proteinG ?? 0), 0),
      carbsG: meals.reduce((sum, m) => sum + (m.carbsG ?? 0), 0),
      fatG: meals.reduce((sum, m) => sum + (m.fatG ?? 0), 0),
      target,
      mealCount: meals.length,
      allMealsCompleted: meals.every((m) => m.completed),
      streak: nutritionStreak,
    },
    glasses,
    workout: {
      week: week.map(({ cal, groups, completed }) => ({ cal, groups, completed })),
      streak: workoutStreak,
    },
    studies,
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })),
    finance: {
      ...getMonthTotals(entries),
      monthLabel: formatMonthYearEs(today.month, today.year),
      bills: bills.map((b) => ({
        id: b.id,
        title: b.title,
        amount: Number(b.amount),
        state: b.state,
        startDay: b.startDay,
        endDay: b.endDay,
        installmentLabel: b.installmentLabel,
      })),
    },
  });
}
