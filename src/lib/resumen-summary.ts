import { compareCalendarDates, type CalendarDate } from "@/lib/date";
import { getWeekDayState, type WeekDayState } from "@/lib/exercise-summary";
import { describeBill } from "@/lib/finance-summary";
import { formatMuscleGroups } from "@/lib/routine-groups";
import { sortTasksByUrgency, type Tone } from "@/lib/task-summary";
import { WATER_TARGET_GLASSES } from "@/lib/water-constants";
import type { BillState } from "@/lib/finance";
import type { MuscleGroup, TaskPriority } from "@/generated/prisma/client";

export type ResumenInput = {
  today: CalendarDate;
  nutrition: {
    configured: boolean;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    target: {
      calories: number;
      calorieMin: number;
      calorieMax: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    } | null;
    mealCount: number;
    allMealsCompleted: boolean;
    streak: number;
  };
  glasses: number;
  workout: {
    week: { cal: CalendarDate; groups: MuscleGroup[]; completed: boolean }[];
    streak: number;
  };
  studies: { id: string; name: string; actualMinutes: number; targetMinutes: number; running: boolean; completed: boolean }[];
  tasks: { id: string; title: string; priority: TaskPriority; dueDate: Date | null }[];
  finance: {
    ingresos: number;
    extras: number;
    gastos: number;
    balance: number;
    monthLabel: string;
    bills: {
      id: string;
      title: string;
      amount: number;
      state: BillState;
      startDay: number;
      endDay: number | null;
      installmentLabel?: string | null;
    }[];
  };
};

export type { Tone, WeekDayState };

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function isStudyDone(entry: ResumenInput["studies"][number]) {
  return entry.completed || entry.actualMinutes >= entry.targetMinutes;
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

export function buildResumen(input: ResumenInput) {
  const { today, nutrition, glasses, workout, studies, tasks, finance } = input;

  const week = workout.week.map(({ cal, groups, completed }, index) => {
    const state = getWeekDayState(cal, today, groups, completed);
    return {
      key: `${cal.year}-${cal.month}-${cal.day}`,
      label: WEEKDAY_LABELS[index],
      state,
      isToday: compareCalendarDates(cal, today) === 0,
    };
  });

  const todayWorkout = workout.week.find(({ cal }) => compareCalendarDates(cal, today) === 0);
  const todayGroups = todayWorkout?.groups ?? [];
  const hasRoutine = workout.week.some(({ groups }) => groups.length > 0);
  const workoutCompleted = Boolean(todayWorkout?.completed);

  const studyActual = studies.reduce((sum, s) => sum + s.actualMinutes, 0);
  const studyTarget = studies.reduce((sum, s) => sum + s.targetMinutes, 0);
  const studyDone = studies.length > 0 && studies.every(isStudyDone);

  const { target } = nutrition;
  const caloriesInRange = !target || (nutrition.calories >= target.calorieMin && nutrition.calories <= target.calorieMax);
  const nutritionDone = nutrition.mealCount > 0 && nutrition.allMealsCompleted && caloriesInRange;
  const waterDone = glasses >= WATER_TARGET_GLASSES;

  const goals = [
    nutrition.configured && {
      key: "nutrition",
      label: "Comidas",
      href: "/comidas",
      done: nutritionDone,
      detail: target ? `${nutrition.calories} / ${target.calories} kcal` : `${nutrition.calories} kcal`,
    },
    {
      key: "water",
      label: "Agua",
      href: "/comidas",
      done: waterDone,
      detail: `${glasses} / ${WATER_TARGET_GLASSES} vasos`,
    },
    todayGroups.length > 0 && {
      key: "workout",
      label: "Ejercicio",
      href: "/ejercicio",
      done: workoutCompleted,
      detail: formatMuscleGroups(todayGroups),
    },
    studies.length > 0 && {
      key: "study",
      label: "Estudio",
      href: "/estudio",
      done: studyDone,
      detail: `${studyActual} / ${studyTarget} min`,
    },
  ].filter((goal) => goal !== false);

  const goalsDone = goals.filter((goal) => goal.done).length;
  const goalsLeft = goals.length - goalsDone;

  const sortedTasks = sortTasksByUrgency(tasks, today);
  const overdueTasks = sortedTasks.filter((task) => task.due?.rank === 0);
  const dueTodayTasks = sortedTasks.filter((task) => task.due?.rank === 1);

  const unpaidBills = finance.bills.filter((bill) => bill.state !== "paid");
  const billOrder: Record<BillState, number> = { urgent: 0, active: 1, inactive: 2, paid: 3 };
  const sortedBills = [...unpaidBills].sort((a, b) => billOrder[a.state] - billOrder[b.state]);
  const pendingBillsAmount = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const received = finance.ingresos + finance.extras;
  const spentPercent = received > 0 ? (finance.gastos / received) * 100 : 0;

  const billDetail = (bill: (typeof unpaidBills)[number]) => describeBill(bill, today.day);

  const attention: { key: string; title: string; detail: string; href: string; tone: Tone }[] = [
    ...sortedBills
      .filter((bill) => bill.state === "urgent")
      .map((bill) => ({
        key: `bill-${bill.id}`,
        title: `Pagar ${bill.title}`,
        detail: billDetail(bill),
        href: "/finanzas/pagos",
        tone: "danger" as Tone,
      })),
    ...[...overdueTasks, ...dueTodayTasks].map((task) => ({
      key: `task-${task.id}`,
      title: task.title,
      detail: task.due!.text,
      href: "/organizacion",
      tone: task.due!.tone,
    })),
    ...(!nutrition.configured
      ? [{ key: "nutrition-setup", title: "Configura tu plan de nutrición", detail: "Para calcular tus calorías y macros", href: "/comidas", tone: "neutral" as Tone }]
      : nutrition.mealCount === 0
        ? [{ key: "meals", title: "Registra tus comidas", detail: "Aún no hay nada registrado hoy", href: "/comidas", tone: "neutral" as Tone }]
        : []),
    ...(todayGroups.length > 0 && !workoutCompleted
      ? [{ key: "workout", title: `Entrenar ${formatMuscleGroups(todayGroups)}`, detail: "Tu rutina de hoy", href: "/ejercicio", tone: "neutral" as Tone }]
      : []),
    ...(studies.length > 0 && !studyDone
      ? [{ key: "study", title: `Estudiar ${Math.max(studyTarget - studyActual, 1)} min más`, detail: `Llevas ${studyActual} de ${studyTarget} min`, href: "/estudio", tone: "neutral" as Tone }]
      : []),
    ...(!waterDone
      ? [{
          key: "water",
          title: `Tomar ${WATER_TARGET_GLASSES - glasses} ${plural(WATER_TARGET_GLASSES - glasses, "vaso", "vasos")} de agua`,
          detail: `Llevas ${glasses} de ${WATER_TARGET_GLASSES}`,
          href: "/comidas",
          tone: "neutral" as Tone,
        }]
      : []),
    ...sortedBills
      .filter((bill) => bill.state === "active")
      .map((bill) => ({
        key: `bill-${bill.id}`,
        title: `Pagar ${bill.title}`,
        detail: billDetail(bill),
        href: "/finanzas/pagos",
        tone: "warning" as Tone,
      })),
  ];

  const headline =
    goals.length === 0
      ? "Sin metas para hoy"
      : goalsLeft === 0
        ? "Cumpliste todo por hoy"
        : `${plural(goalsLeft, "Te falta", "Te faltan")} ${goalsLeft} de ${goals.length} ${plural(goals.length, "meta", "metas")}`;

  return {
    headline,
    goals,
    goalsDone,
    attention: attention.slice(0, 5),
    attentionMore: Math.max(attention.length - 5, 0),
    nutrition: { ...nutrition, glasses, targetGlasses: WATER_TARGET_GLASSES },
    workout: {
      hasRoutine,
      todayLabel: formatMuscleGroups(todayGroups),
      isRestDay: todayGroups.length === 0,
      completed: workoutCompleted,
      week,
      streak: workout.streak,
    },
    study: { entries: studies, actual: studyActual, target: studyTarget, done: studyDone },
    tasks: {
      count: tasks.length,
      overdue: overdueTasks.length,
      top: sortedTasks.slice(0, 3).map(({ id, title, priority, due }) => ({ id, title, priority, due })),
    },
    finance: {
      ...finance,
      received,
      spentPercent,
      pendingBillsAmount,
      pendingBillsCount: unpaidBills.length,
      topBills: sortedBills.slice(0, 2).map((bill) => ({
        id: bill.id,
        title: bill.title,
        state: bill.state,
        detail: billDetail(bill),
      })),
    },
  };
}

export type ResumenData = ReturnType<typeof buildResumen>;
