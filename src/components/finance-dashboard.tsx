import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { markBillPaid, unmarkBillPaid } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar } from "@/components/ui/progress";
import { FinanceEntrySheet } from "@/components/finance-entry-sheet";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { cn } from "@/lib/cn";
import type { FinanceView } from "@/lib/finance-summary";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const HERO_PRIMARY = "bg-white text-[#14141a] hover:bg-white/90";
const HERO_SECONDARY = "bg-white/10 text-white hover:bg-white/15";

function BalanceHero({ view, today }: { view: FinanceView; today: string }) {
  const overspent = view.balance < 0;

  return (
    <div className="relative flex h-full min-h-80 flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#14141a] p-6 text-white shadow-soft sm:p-8">
      <div aria-hidden="true" className="hero-hearth pointer-events-none absolute inset-0" />

      <div className="relative">
        <p className="text-sm font-medium text-white/60">Disponible en {view.monthName}</p>
        <p
          className={cn(
            "mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl",
            overspent && "text-[#fb7185]"
          )}
        >
          <CountUp value={view.balance} format="currency" />
        </p>

        {!view.hasSalary && (
          <p className="mt-2 text-sm text-white/60">Aún no registras tu sueldo de {view.monthName}.</p>
        )}
        {view.hasSalary && view.pendingCount > 0 && (
          <p className="mt-2 text-sm text-white/60">
            {view.pendingCount === 1 ? "Con tu pago pendiente" : `Con tus ${view.pendingCount} pagos pendientes`} te
            quedarían{" "}
            <span className={cn("font-medium whitespace-nowrap text-white", view.afterBills < 0 && "text-[#fb7185]")}>
              {currency.format(view.afterBills)}
            </span>
          </p>
        )}
      </div>

      <div className="relative space-y-5">
        {view.received > 0 && (
          <div className="space-y-2">
            <ProgressBar
              percent={view.spentPercent}
              className="bg-white/10"
              fillClassName={view.spentPercent > 100 ? "bg-[#fb7185]" : "bg-[var(--ember)]"}
            />
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-white/60">
              <span>
                Gastaste <span className="font-medium text-white">{currency.format(view.spent)}</span>
              </span>
              <span>
                Entró <span className="font-medium text-white">{currency.format(view.received)}</span>
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:flex">
          <FinanceEntrySheet
            today={today}
            initialType={view.hasSalary ? "GASTO" : "INGRESO"}
            triggerLabel={view.hasSalary ? "Agregar gasto" : "Registrar sueldo"}
            triggerClassName={HERO_PRIMARY}
          />
          <FinanceEntrySheet
            today={today}
            initialType={view.hasSalary ? "INGRESO" : "GASTO"}
            triggerLabel={view.hasSalary ? "Registrar ingreso" : "Agregar gasto"}
            triggerClassName={HERO_SECONDARY}
          />
        </div>
      </div>
    </div>
  );
}

function BillsCard({ view }: { view: FinanceView }) {
  const visible = view.bills.slice(0, 5);

  return (
    <Card className="flex h-full flex-col gap-3 rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Pagos del mes</h2>
        <Link
          href="/finanzas/pagos"
          className="-mr-1.5 flex items-center gap-0.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {view.billsTotal > 0 ? "Ver todos" : "Agregar"}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {view.billsTotal === 0 ? (
        <div className="flex flex-1 flex-col justify-center py-4">
          <p className="text-lg font-semibold tracking-tight text-foreground">Sin pagos registrados</p>
          <p className="mt-1 text-sm text-muted">Agrega tu gimnasio, internet o suscripciones y te avisamos cuándo toca.</p>
        </div>
      ) : (
        <>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {view.pendingCount === 0 ? (
              "Todo pagado"
            ) : (
              <>
                <CountUp value={view.pendingAmount} format="currency" />
                <span className="ml-1.5 text-sm font-normal tracking-normal text-muted">por pagar</span>
              </>
            )}
          </p>
          <ul className="divide-y divide-border/70">
            {visible.map((bill) => {
              const paid = bill.state === "paid";
              return (
                <li key={bill.id} className="flex items-center gap-3 py-2.5 last:pb-0">
                  <ToggleCheckbox
                    checked={paid}
                    disabled={bill.state === "inactive"}
                    label={`${bill.title}: ${paid ? "desmarcar pago" : "marcar como pagado"}`}
                    className="size-8 rounded-xl"
                    action={paid ? unmarkBillPaid.bind(null, bill.id) : markBillPaid.bind(null, bill.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", paid ? "text-muted" : "text-foreground")}>
                      {bill.title}
                    </p>
                    <p
                      className={cn(
                        "truncate text-xs",
                        bill.state === "urgent" ? "text-danger" : bill.state === "active" ? "text-warning" : "text-muted"
                      )}
                    >
                      {bill.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {view.bills.length > visible.length && (
            <p className="text-xs text-muted">Y {view.bills.length - visible.length} más</p>
          )}
        </>
      )}
    </Card>
  );
}

function DailySpendingCard({ view }: { view: FinanceView }) {
  const max = view.peak?.amount ?? 0;

  return (
    <Card className="flex h-full flex-col gap-3 rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Gastos por día</h2>

      {!view.peak ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted">
          Cuando registres gastos, aquí verás en qué días se te va más.
        </p>
      ) : (
        <>
          <div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              <CountUp value={view.spent} format="currency" />
            </p>
            <p className="text-xs text-muted">
              El día que más gastaste fue el {view.peak.day}: {currency.format(view.peak.amount)}
            </p>
          </div>

          <div
            role="img"
            aria-label={`Gastos por día de ${view.monthName}. El mayor fue el día ${view.peak.day} con ${currency.format(view.peak.amount)}.`}
            className="mt-auto flex h-28 items-end gap-px sm:gap-0.5"
          >
            {view.days.map((day) => (
              <div
                key={day.day}
                title={`Día ${day.day}: ${currency.format(day.amount)}`}
                className={cn(
                  "relative h-full flex-1 overflow-hidden rounded-t-sm",
                  day.isFuture ? "bg-surface-2/50" : "bg-surface-2"
                )}
              >
                {day.amount > 0 && (
                  <span
                    className={cn(
                      "water-fill absolute inset-x-0 bottom-0 rounded-t-sm",
                      day.day === view.peak?.day ? "bg-accent" : "bg-foreground/70"
                    )}
                    style={{ height: `${(day.amount / max) * 100}%`, "--i": day.day } as React.CSSProperties}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted tabular-nums">
            <span>1</span>
            <span>{view.days.length}</span>
          </div>
        </>
      )}
    </Card>
  );
}

export function FinanceDashboard({
  view,
  today,
  movements,
}: {
  view: FinanceView;
  today: string;
  movements: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="reveal [--i:1] lg:col-span-7">
        <BalanceHero view={view} today={today} />
      </div>
      <div className="reveal [--i:2] lg:col-span-5">
        <BillsCard view={view} />
      </div>
      <div className="reveal [--i:3] lg:col-span-7">{movements}</div>
      <div className="reveal [--i:4] lg:col-span-5">
        <DailySpendingCard view={view} />
      </div>
    </div>
  );
}
