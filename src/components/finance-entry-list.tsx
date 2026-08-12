"use client";

import { useState } from "react";
import type { FinanceEntry } from "@/generated/prisma/client";
import { deleteFinanceEntry } from "@/actions/finance";

type SerializedFinanceEntry = Omit<FinanceEntry, "amount"> & { amount: number };
import { formatShortDateEs } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  EXTRA: "Dinero Extra",
  GASTO: "Gasto",
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

type FilterValue = "TODOS" | "EXTRA" | "GASTO";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "EXTRA", label: "Dinero Extra" },
  { value: "GASTO", label: "Gastos" },
];

export function FinanceEntryList({ entries }: { entries: SerializedFinanceEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("TODOS");

  if (entries.length === 0) {
    return <p className="text-sm text-muted">Aún no hay movimientos registrados.</p>;
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="secondary" className="w-full" onClick={() => setIsOpen(true)}>
        Mostrar movimientos del mes
      </Button>
    );
  }

  const filtered = filter === "TODOS" ? entries : entries.filter((entry) => entry.type === filter);

  return (
    <div className="space-y-3">
      <SegmentedControl
        layoutId="finance-entry-filter"
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No hay movimientos para este filtro.</p>
      ) : (
        filtered.map((entry) => (
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
        ))
      )}

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="w-full text-center text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Ocultar movimientos
      </button>
    </div>
  );
}
