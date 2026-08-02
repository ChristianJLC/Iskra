import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatMonthYearEs, getMonthBounds } from "@/lib/date";
import { ensureQuincenaIngresos, getMonthTotals } from "@/lib/finance";
import { setBiweeklyIncome, addFinanceEntry } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { FinanceChart } from "@/components/finance-chart";
import { FinanceEntryList } from "@/components/finance-entry-list";
import { cn } from "@/lib/cn";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function FinanzasPage() {
  const { userId } = await verifySession();

  await ensureQuincenaIngresos(userId);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start: monthStart, end: monthEnd } = getMonthBounds(month, year);

  const [settings, entries] = await Promise.all([
    prisma.financeSettings.findUnique({
      where: { userId_month_year: { userId, month, year } },
    }),
    prisma.financeEntry.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  const biweeklyIncome = settings ? Number(settings.biweeklyIncome) : 0;
  const { ingresos, extras, gastos, balance } = getMonthTotals(entries);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Finanzas</h1>
          <p className="text-sm text-muted">{formatMonthYearEs(month, year)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm font-medium">
          <Link href="/finanzas/pagos" className="text-accent hover:underline">
            Pagos mensuales
          </Link>
          <Link href="/finanzas/historial" className="text-accent hover:underline">
            Ver historial
          </Link>
        </div>
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
          <p
            className={cn(
              "text-sm font-semibold",
              balance >= 0 ? "text-accent" : "text-danger"
            )}
          >
            {currency.format(balance)}
          </p>
        </div>

        <FinanceChart ingresos={ingresos} extras={extras} gastos={gastos} balance={balance} />
      </Card>

      <Card>
        <form action={setBiweeklyIncome} className="space-y-4">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <div>
            <Label htmlFor="biweeklyIncome">Ingreso fijo quincenal</Label>
            <Input
              id="biweeklyIncome"
              name="biweeklyIncome"
              type="number"
              min={0}
              step="0.01"
              defaultValue={biweeklyIncome || undefined}
              placeholder="0.00"
              required
            />
          </div>
          <Button type="submit" variant="secondary">
            Guardar ingreso quincenal
          </Button>
        </form>
      </Card>

      <Card>
        <form action={addFinanceEntry} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="EXTRA">Dinero Extra</option>
              <option value="GASTO">Gasto</option>
            </select>
          </div>

          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" min={0.01} step="0.01" placeholder="0.00" required />
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input id="description" name="description" placeholder="Ej. Almuerzo, propina de la tarde…" />
          </div>

          <SubmitButton>Agregar movimiento</SubmitButton>
        </form>
      </Card>

      <FinanceEntryList entries={entries} />
    </div>
  );
}
