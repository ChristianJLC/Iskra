import type { FinanceEntry } from "@/generated/prisma/client";
import { deleteFinanceEntry } from "@/actions/finance";
import { formatShortDateEs } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  EXTRA: "Dinero Extra",
  GASTO: "Gasto",
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export function FinanceEntryList({ entries }: { entries: FinanceEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">Aún no hay movimientos registrados.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  entry.type === "GASTO" ? "bg-danger/10 text-danger" : "bg-accent/15 text-accent"
                )}
              >
                {TYPE_LABELS[entry.type]}
              </span>
              <span className="text-sm font-medium text-foreground">
                {entry.type === "GASTO" ? "-" : "+"}
                {currency.format(Number(entry.amount))}
              </span>
            </div>
            {entry.description && <p className="mt-0.5 text-xs text-muted">{entry.description}</p>}
            <p className="mt-0.5 text-xs text-muted">{formatShortDateEs(entry.date)}</p>
          </div>
          <DeleteButton action={deleteFinanceEntry.bind(null, entry.id)} />
        </Card>
      ))}
    </div>
  );
}
