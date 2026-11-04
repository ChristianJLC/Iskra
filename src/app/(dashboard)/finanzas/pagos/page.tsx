import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { getZonedCalendarDate } from "@/lib/date";
import { getBillsWithState, type BillState } from "@/lib/finance";
import { describeBill, describePaidBill } from "@/lib/finance-summary";
import { deleteRecurringBill, markBillPaid, unmarkBillPaid } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { RecurringBillForm } from "@/components/recurring-bill-form";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

const PRIORITY_STYLES: Record<string, string> = {
  ALTA: "bg-danger/10 text-danger",
  MEDIA: "bg-surface-2 text-foreground",
  BAJA: "bg-surface-2 text-muted",
};

const PRIORITY_LABELS: Record<string, string> = {
  ALTA: "Prioridad alta",
  MEDIA: "Prioridad media",
  BAJA: "Prioridad baja",
};

const DETAIL_STYLES: Record<BillState, string> = {
  inactive: "text-muted",
  active: "text-warning",
  urgent: "text-danger",
  paid: "text-muted",
};

export default async function PagosMensualesPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const { day: today } = getZonedCalendarDate(timezone);

  const bills = await getBillsWithState(userId, timezone);
  const unpaid = bills.filter((bill) => !bill.paid);
  const pendingAmount = unpaid.reduce((sum, bill) => sum + Number(bill.amount), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="reveal">
        <Link
          href="/finanzas"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Finanzas
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis pagos</h1>
          <RecurringBillForm />
        </div>
      </div>

      {bills.length === 0 ? (
        <Card className="reveal rounded-3xl py-10 text-center [--i:1]">
          <p className="text-lg font-semibold tracking-tight text-foreground">Sin pagos registrados</p>
          <p className="mt-1 text-sm text-muted">Agrega tu gimnasio, internet o suscripciones para no olvidarlos.</p>
        </Card>
      ) : (
        <Card className="reveal space-y-3 rounded-3xl [--i:1]">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {unpaid.length === 0 ? (
              "Todo pagado"
            ) : (
              <>
                <CountUp value={pendingAmount} format="currency" />
                <span className="ml-1.5 text-sm font-normal tracking-normal text-muted">por pagar este mes</span>
              </>
            )}
          </p>

          <ul className="divide-y divide-border/70">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center gap-3 py-3 last:pb-0">
                <ToggleCheckbox
                  checked={bill.paid}
                  disabled={bill.state === "inactive"}
                  label={`${bill.title}: ${bill.paid ? "desmarcar pago" : "marcar como pagado"}`}
                  className="size-8 rounded-xl"
                  action={bill.paid ? unmarkBillPaid.bind(null, bill.id) : markBillPaid.bind(null, bill.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", bill.paid ? "text-muted" : "text-foreground")}>
                    {bill.title}
                  </p>
                  <p className={cn("truncate text-xs", DETAIL_STYLES[bill.state])}>
                    {bill.paid
                      ? describePaidBill(bill.paidOn, bill.installmentLabel)
                      : describeBill({ ...bill, amount: Number(bill.amount) }, today)}
                  </p>
                  {bill.description && <p className="truncate text-xs text-muted">{bill.description}</p>}
                </div>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:block",
                    PRIORITY_STYLES[bill.priority]
                  )}
                >
                  {PRIORITY_LABELS[bill.priority]}
                </span>
                <DeleteButton action={deleteRecurringBill.bind(null, bill.id)} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
