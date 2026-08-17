import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatMonthYearEs, getZonedCalendarDate } from "@/lib/date";
import { getStudyHistorialMonths } from "@/lib/study";
import { Card } from "@/components/ui/card";

export default async function EstudioHistorialPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const { year, month } = getZonedCalendarDate(timezone);
  const months = await getStudyHistorialMonths(userId, month, year, timezone);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/estudio" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Estudio
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Historial de estudio</h1>
      </div>

      {months.length === 0 && (
        <p className="text-sm text-muted">Aún no hay meses anteriores con estudio registrado.</p>
      )}

      <div className="space-y-3">
        {months.map(({ month, year, totalActual, totalTarget, rate }) => (
          <Link key={`${year}-${month}`} href={`/estudio/historial/${year}/${month}`}>
            <Card className="flex items-center justify-between transition-colors hover:bg-surface-hover">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{formatMonthYearEs(month, year)}</h2>
                <p className="text-xs text-muted">
                  {totalActual}/{totalTarget} min
                </p>
              </div>
              <p className="text-lg font-semibold text-accent">{Math.round(rate * 100)}%</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
