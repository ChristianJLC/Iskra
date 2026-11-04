"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { FinanceEntry } from "@/generated/prisma/client";
import { deleteFinanceEntry } from "@/actions/finance";
import { formatShortDateEs } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

type SerializedFinanceEntry = Omit<FinanceEntry, "amount"> & { amount: number };

const TYPE_LABELS: Record<string, string> = {
  INGRESO: "Sueldo",
  EXTRA: "Dinero extra",
  GASTO: "Gasto",
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

type FilterValue = "TODOS" | "ENTRADAS" | "GASTOS";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ENTRADAS", label: "Ingresos" },
  { value: "GASTOS", label: "Gastos" },
];

export function FinanceEntryList({
  entries,
  timezone,
}: {
  entries: SerializedFinanceEntry[];
  timezone: string;
}) {
  const [filter, setFilter] = useState<FilterValue>("TODOS");

  const filtered =
    filter === "TODOS"
      ? entries
      : entries.filter((entry) => (filter === "GASTOS" ? entry.type === "GASTO" : entry.type !== "GASTO"));

  return (
    <Card className="h-full space-y-3 rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Movimientos</h2>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Aún no hay movimientos este mes.</p>
      ) : (
        <>
          <SegmentedControl
            layoutId="finance-entry-filter"
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
          />

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No hay movimientos para este filtro.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {filtered.map((entry) => {
                const isExpense = entry.type === "GASTO";
                const Icon = isExpense ? ArrowUpRight : ArrowDownLeft;
                return (
                  <li key={entry.id} className="flex items-center gap-3 py-2.5 last:pb-0">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                        isExpense ? "bg-surface-2 text-muted" : "bg-accent/15 text-accent"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.description || TYPE_LABELS[entry.type]}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {entry.description && `${TYPE_LABELS[entry.type]} · `}
                        {formatShortDateEs(entry.date, timezone)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        isExpense ? "text-foreground" : "text-accent"
                      )}
                    >
                      {isExpense ? "−" : "+"}
                      {currency.format(entry.amount)}
                    </p>
                    <DeleteButton action={deleteFinanceEntry.bind(null, entry.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
