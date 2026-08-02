import Link from "next/link";
import { Utensils, Dumbbell, BookOpen, ListChecks, Wallet, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getCurrentUser } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { ensureQuincenaIngresos } from "@/lib/finance";
import { getTodayWorkout, ROUTINE_GROUP_LABELS } from "@/lib/exercise";
import { Card } from "@/components/ui/card";

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
  const studyActual = studies.reduce((sum, s) => sum + s.actualMinutes, 0);

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
      icon: Utensils,
      title: "Comidas",
      value: `${mealsCompleted}/${meals.length || 0}`,
      hint: meals.length ? "completadas hoy" : "sin registros hoy",
    },
    {
      href: "/ejercicio",
      icon: Dumbbell,
      title: "Ejercicio",
      value:
        todayWorkout.group === "DESCANSO" ? "Descanso" : todayWorkout.completed ? "Completado" : "Pendiente",
      hint:
        todayWorkout.group === "DESCANSO" ? "hoy no toca rutina" : ROUTINE_GROUP_LABELS[todayWorkout.group],
    },
    {
      href: "/estudio",
      icon: BookOpen,
      title: "Estudio",
      value: studyTarget ? `${studyActual}/${studyTarget} min` : "Sin meta",
      hint: "de tu meta de hoy",
    },
    {
      href: "/organizacion",
      icon: ListChecks,
      title: "Organización",
      value: `${pendingTasks}`,
      hint: "tareas pendientes",
    },
    {
      href: "/finanzas",
      icon: Wallet,
      title: "Finanzas",
      value: currency.format(balance),
      hint: "balance del mes",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Hola, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, value, hint }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center justify-between transition-colors hover:border-accent">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-foreground">{value}</span> {hint}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
