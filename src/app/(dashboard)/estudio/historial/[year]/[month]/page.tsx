import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatMonthYearEs, formatShortDateEs, getMonthBounds } from "@/lib/date";
import { getMonthlyStudyCompliance, effectiveMinutes } from "@/lib/study";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export default async function EstudioHistorialMesPage({
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

  const [{ totalActual, totalTarget, rate }, entries] = await Promise.all([
    getMonthlyStudyCompliance(userId, month, year),
    prisma.studyEntry.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/estudio/historial"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Historial
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{formatMonthYearEs(month, year)}</h1>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Minutos estudiados</p>
          <p className="text-sm font-semibold text-foreground">
            {totalActual}/{totalTarget} min
          </p>
        </div>
        <p className="text-2xl font-semibold text-accent">{Math.round(rate * 100)}%</p>
      </Card>

      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted">No hay metas de estudio registradas este mes.</p>
        )}

        {entries.map((entry) => (
          <Card key={entry.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">{entry.subjectName}</p>
              <p className="text-xs text-muted">{formatShortDateEs(entry.date)}</p>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                entry.completed ? "bg-accent/15 text-accent" : "bg-surface-hover text-muted"
              )}
            >
              {entry.completed && <Check className="size-3" />}
              {effectiveMinutes(entry)}/{entry.targetMinutes} min
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
