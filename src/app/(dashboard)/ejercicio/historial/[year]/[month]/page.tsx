import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatMonthYearEs, formatShortDateEs, getMonthBounds } from "@/lib/date";
import { getMonthlyCompliance, ROUTINE_GROUP_LABELS } from "@/lib/exercise";
import { ROUTINE_GROUP_ICONS } from "@/lib/routine-groups";
import { Card } from "@/components/ui/card";

export default async function EjercicioHistorialMesPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    notFound();
  }

  const { userId } = await verifySession();

  const { start, end } = getMonthBounds(month, year);

  const [{ scheduled, completed, rate }, completions] = await Promise.all([
    getMonthlyCompliance(userId, month, year),
    prisma.workoutCompletion.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/ejercicio/historial"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Historial
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{formatMonthYearEs(month, year)}</h1>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Días cumplidos</p>
          <p className="text-sm font-semibold text-foreground">
            {completed}/{scheduled}
          </p>
        </div>
        <p className="text-2xl font-semibold text-accent">{Math.round(rate * 100)}%</p>
      </Card>

      <div className="space-y-3">
        {completions.length === 0 && (
          <p className="text-sm text-muted">No hay días cumplidos registrados este mes.</p>
        )}

        {completions.map((c) => {
          const Icon = ROUTINE_GROUP_ICONS[c.group];
          return (
            <Card key={c.id} className="flex items-center justify-between py-3">
              <p className="text-sm text-foreground">{formatShortDateEs(c.date)}</p>
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                <Icon className="size-3" />
                {ROUTINE_GROUP_LABELS[c.group]}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
