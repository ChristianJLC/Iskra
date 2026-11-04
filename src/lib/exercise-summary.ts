import { compareCalendarDates, type CalendarDate } from "@/lib/date";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_OPTIONS, formatMuscleGroups } from "@/lib/routine-groups";
import type { MuscleGroup } from "@/generated/prisma/client";

export type WeekDayState = "done" | "missed" | "today" | "upcoming" | "rest";

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function getWeekDayState(
  cal: CalendarDate,
  today: CalendarDate,
  groups: MuscleGroup[],
  completed: boolean
): WeekDayState {
  if (groups.length === 0) return "rest";
  if (completed) return "done";
  const position = compareCalendarDates(cal, today);
  if (position < 0) return "missed";
  return position === 0 ? "today" : "upcoming";
}

export type WorkoutViewInput = {
  today: CalendarDate;
  week: { cal: CalendarDate; groups: MuscleGroup[]; completed: boolean }[];
  streak: number;
  month: { scheduled: number; completed: number };
};

export function buildWorkoutView({ today, week, streak, month }: WorkoutViewInput) {
  const todayIndex = week.findIndex(({ cal }) => compareCalendarDates(cal, today) === 0);

  const days = week.map(({ cal, groups, completed }, index) => {
    const position = compareCalendarDates(cal, today);
    return {
      key: `${cal.year}-${cal.month}-${cal.day}`,
      cal,
      name: WEEKDAY_NAMES[index],
      shortName: WEEKDAY_SHORT[index],
      groupsLabel: formatMuscleGroups(groups),
      isRest: groups.length === 0,
      isToday: position === 0,
      completed,
      canToggle: groups.length > 0 && position <= 0,
      state: getWeekDayState(cal, today, groups, completed),
    };
  });

  const trainingDays = days.filter((day) => !day.isRest);
  const nextOffset = week.length
    ? Array.from({ length: 7 }, (_, i) => i + 1).find(
        (offset) => week[(todayIndex + offset) % 7].groups.length > 0
      )
    : undefined;
  const nextIndex = nextOffset != null ? (todayIndex + nextOffset) % 7 : null;

  const muscles = MUSCLE_GROUP_OPTIONS.map((group) => {
    const planned = week.filter((day) => day.groups.includes(group));
    return {
      group,
      label: MUSCLE_GROUP_LABELS[group],
      planned: planned.length,
      done: planned.filter((day) => day.completed).length,
    };
  }).filter((muscle) => muscle.planned > 0);

  return {
    today: days[todayIndex],
    days,
    hasRoutine: trainingDays.length > 0,
    weekTotal: trainingDays.length,
    weekDone: trainingDays.filter((day) => day.completed).length,
    weekMissed: trainingDays.filter((day) => day.state === "missed").length,
    next:
      nextIndex != null
        ? {
            when: nextOffset === 1 ? "Mañana" : WEEKDAY_NAMES[nextIndex],
            label: formatMuscleGroups(week[nextIndex].groups),
          }
        : null,
    muscles,
    streak,
    month,
  };
}

export type WorkoutView = ReturnType<typeof buildWorkoutView>;
