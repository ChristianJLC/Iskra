import { Utensils, Dumbbell, BookOpen, ListChecks, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getCurrentUser } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { ensureQuincenaIngresos } from "@/lib/finance";
import { getTodayWorkout, formatMuscleGroups } from "@/lib/exercise";
import { effectiveMinutes } from "@/lib/study";
import { DashboardCardsGrid } from "@/components/dashboard-cards";
import { UserAvatar } from "@/components/user-avatar";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function ResumenPage() {
  const { userId } = await verifySession();
  const user = await getCurrentUser();

  await ensureQuincenaIngresos(userId);

  const today = { gte: startOfToday(), lt: endOfToday() };
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [meals, todayWorkout, studies, pendingTasks, financeEntries] = await Promise.all([
    prisma.mealEntry.findMany({ where: { userId, date: today } }),
    getTodayWorkout(userId),
    prisma.studyEntry.findMany({ where: { userId, date: today } }),
    prisma.task.count({ where: { userId, completed: false } }),
    prisma.financeEntry.findMany({ where: { userId, date: { gte: monthStart, lt: monthEnd } } }),
  ]);

  const mealsCompleted = meals.filter((m) => m.completed).length;
  const studyTarget = studies.reduce((sum, s) => sum + s.targetMinutes, 0);
  const studyActual = studies.reduce((sum, s) => sum + effectiveMinutes(s), 0);

  const ingresos = financeEntries
    .filter((e) => e.type === "INGRESO")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const extras = financeEntries
    .filter((e) => e.type === "EXTRA")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const gastos = financeEntries
    .filter((e) => e.type === "GASTO")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = ingresos + extras - gastos;

  const cards = [
    {
      href: "/comidas",
      icon: <Utensils className="size-5" />,
      title: "Nutrición",
      value: `${mealsCompleted}/${meals.length || 0}`,
      hint: meals.length ? "completadas hoy" : "sin registros hoy",
    },
    {
      href: "/ejercicio",
      icon: <Dumbbell className="size-5" />,
      title: "Ejercicio",
      value:
        todayWorkout.groups.length === 0
          ? "Descanso"
          : todayWorkout.completed
            ? "Completado"
            : "Pendiente",
      hint:
        todayWorkout.groups.length === 0 ? "hoy no toca rutina" : formatMuscleGroups(todayWorkout.groups),
    },
    {
      href: "/estudio",
      icon: <BookOpen className="size-5" />,
      title: "Estudio",
      value: studyTarget ? `${studyActual}/${studyTarget} min` : "Sin meta",
      hint: "de tu meta de hoy",
    },
    {
      href: "/organizacion",
      icon: <ListChecks className="size-5" />,
      title: "Organización",
      value: `${pendingTasks}`,
      hint: "tareas pendientes",
    },
    {
      href: "/finanzas",
      icon: <Wallet className="size-5" />,
      title: "Finanzas",
      value: currency.format(balance),
      hint: "balance del mes",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <UserAvatar avatarId={user.avatarId} size={48} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
        </div>
      </div>

      <DashboardCardsGrid cards={cards} />
    </div>
  );
}
