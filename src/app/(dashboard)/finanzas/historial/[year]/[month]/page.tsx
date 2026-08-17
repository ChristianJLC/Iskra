import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatMonthYearEs, getMonthBounds } from "@/lib/date";
import { getMonthTotals } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { FinanceChart } from "@/components/finance-chart";
import { FinanceEntryList } from "@/components/finance-entry-list";
import { cn } from "@/lib/cn";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function HistorialMesPage({
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
  const timezone = await getUserTimezone();

  const { start: monthStart, end: monthEnd } = getMonthBounds(timezone, month, year);

  const entries = await prisma.financeEntry.findMany({
    where: { userId, date: { gte: monthStart, lt: monthEnd } },
    orderBy: { date: "desc" },
  });

  const { ingresos, extras, gastos, balance } = getMonthTotals(entries);
  const serializedEntries = entries.map((entry) => ({ ...entry, amount: Number(entry.amount) }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/finanzas/historial"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Historial
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{formatMonthYearEs(month, year)}</h1>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">Ingreso</p>
            <p className="text-sm font-semibold text-foreground">{currency.format(ingresos)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Extra</p>
            <p className="text-sm font-semibold text-foreground">{currency.format(extras)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Gasto</p>
            <p className="text-sm font-semibold text-foreground">{currency.format(gastos)}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted">Balance</p>
          <p className={cn("text-sm font-semibold", balance >= 0 ? "text-accent" : "text-danger")}>
            {currency.format(balance)}
          </p>
        </div>

        <FinanceChart ingresos={ingresos} extras={extras} gastos={gastos} balance={balance} />
      </Card>

      <FinanceEntryList entries={serializedEntries} timezone={timezone} />
    </div>
  );
}
