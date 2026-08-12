import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { formatMonthYearEs } from "@/lib/date";
import { getExerciseHistorialMonths } from "@/lib/exercise";
import { Card } from "@/components/ui/card";

export default async function EjercicioHistorialPage() {
  const { userId } = await verifySession();

  const now = new Date();
  const months = await getExerciseHistorialMonths(userId, now.getMonth() + 1, now.getFullYear());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/ejercicio" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Ejercicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Historial de cumplimiento</h1>
      </div>

      {months.length === 0 && (
        <p className="text-sm text-muted">Aún no hay meses anteriores con rutina registrada.</p>
      )}

      <div className="space-y-3">
        {months.map(({ month, year, scheduled, completed, rate }) => (
          <Link key={`${year}-${month}`} href={`/ejercicio/historial/${year}/${month}`}>
            <Card className="flex items-center justify-between transition-colors hover:bg-surface-hover">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{formatMonthYearEs(month, year)}</h2>
                <p className="text-xs text-muted">
                  {completed}/{scheduled} días cumplidos
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
