import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatMonthYearEs, getZonedCalendarDate } from "@/lib/date";
import { getHistorialMonths } from "@/lib/finance";
import { Card } from "@/components/ui/card";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function HistorialPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const { year, month } = getZonedCalendarDate(timezone);
  const months = await getHistorialMonths(userId, month, year, timezone);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/finanzas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Finanzas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Historial</h1>
      </div>

      {months.length === 0 && (
        <p className="text-sm text-muted">Aún no hay meses anteriores con movimientos.</p>
      )}

      <div className="space-y-3">
        {months.map(({ month, year, ingresos, extras, gastos, balance }) => (
          <Link key={`${year}-${month}`} href={`/finanzas/historial/${year}/${month}`}>
            <Card className="space-y-3 transition-colors hover:bg-surface-hover">
              <h2 className="text-sm font-semibold text-foreground">{formatMonthYearEs(month, year)}</h2>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted">Ingreso</p>
                  <p className="text-sm font-semibold text-foreground">{currency.format(ingresos)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Extras</p>
                  <p className="text-sm font-semibold text-foreground">{currency.format(extras)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Gastos</p>
                  <p className="text-sm font-semibold text-foreground">{currency.format(gastos)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Ahorro</p>
                  <p className={`text-sm font-semibold ${balance >= 0 ? "text-accent" : "text-danger"}`}>
                    {currency.format(balance)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
