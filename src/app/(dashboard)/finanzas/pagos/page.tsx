import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getBillsWithState, type BillState } from "@/lib/finance";
import { deleteRecurringBill, markBillPaid, unmarkBillPaid } from "@/actions/finance";
import { Card } from "@/components/ui/card";
import { RecurringBillForm } from "@/components/recurring-bill-form";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

const PRIORITY_STYLES: Record<string, string> = {
  ALTA: "bg-danger/10 text-danger",
  MEDIA: "bg-accent/15 text-accent",
  BAJA: "bg-surface-hover text-muted",
};

const PRIORITY_LABELS: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const STATE_OPACITY: Record<BillState, string> = {
  inactive: "opacity-50",
  active: "",
  urgent: "",
  paid: "opacity-70",
};

const STATE_BORDER_COLOR: Record<BillState, string | undefined> = {
  inactive: undefined,
  active: "var(--warning)",
  urgent: "var(--danger)",
  paid: undefined,
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function PagosMensualesPage() {
  const { userId } = await verifySession();

  const bills = await getBillsWithState(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/finanzas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Finanzas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Pagos mensuales</h1>
        <p className="text-sm text-muted">Servicios y suscripciones que se repiten cada mes.</p>
      </div>

      <RecurringBillForm />

      <div className="space-y-3">
        {bills.length === 0 && <p className="text-sm text-muted">Aún no tienes pagos mensuales registrados.</p>}

        {bills.map((bill) => (
          <Card
            key={bill.id}
            className={cn("flex items-start gap-3 py-4 transition-colors", STATE_OPACITY[bill.state])}
            style={STATE_BORDER_COLOR[bill.state] ? { borderColor: STATE_BORDER_COLOR[bill.state] } : undefined}
          >
            <ToggleCheckbox
              checked={bill.paid}
              disabled={bill.state === "inactive"}
              action={bill.paid ? unmarkBillPaid.bind(null, bill.id) : markBillPaid.bind(null, bill.id)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-sm text-foreground",
                    bill.paid && "text-muted line-through"
                  )}
                >
                  {bill.title}
                </p>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_STYLES[bill.priority])}>
                  {PRIORITY_LABELS[bill.priority]}
                </span>
                {bill.state === "urgent" && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                    Urgente
                  </span>
                )}
                {bill.state === "active" && (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                    Disponible
                  </span>
                )}
              </div>
              {bill.description && <p className="mt-0.5 text-xs text-muted">{bill.description}</p>}
              <p className="mt-0.5 text-xs text-muted">
                {bill.endDay ? `Del ${bill.startDay} al ${bill.endDay}` : `Desde el ${bill.startDay} de cada mes`} ·{" "}
                {currency.format(Number(bill.amount))}
              </p>
            </div>
            <DeleteButton action={deleteRecurringBill.bind(null, bill.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
