"use client";

import { useState } from "react";
import { addFinanceEntry } from "@/actions/finance";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/cn";

type EntryType = "INGRESO" | "EXTRA" | "GASTO";

const TYPE_OPTIONS: { value: EntryType; label: string }[] = [
  { value: "INGRESO", label: "Sueldo" },
  { value: "EXTRA", label: "Extra" },
  { value: "GASTO", label: "Gasto" },
];

const TYPE_COPY: Record<EntryType, { title: string; hint: string; placeholder: string; amountLabel: string }> = {
  INGRESO: {
    title: "Registrar sueldo",
    amountLabel: "Pago recibido",
    hint: "Pon lo que realmente recibiste, ya con la AFP y tus otros descuentos.",
    placeholder: "Ej. Sueldo de noviembre",
  },
  EXTRA: {
    title: "Registrar dinero extra",
    amountLabel: "¿Cuánto recibiste?",
    hint: "Propinas, trabajos aparte o cualquier otro dinero que entró.",
    placeholder: "Ej. Trabajo del fin de semana",
  },
  GASTO: {
    title: "Registrar gasto",
    amountLabel: "¿Cuánto gastaste?",
    hint: "Lo que salió de tu bolsillo.",
    placeholder: "Ej. Almuerzo, pasajes…",
  },
};

export function FinanceEntrySheet({
  today,
  initialType,
  triggerLabel,
  triggerClassName,
}: {
  today: string;
  initialType: EntryType;
  triggerLabel: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<EntryType>(initialType);
  const [date, setDate] = useState(today);
  const copy = TYPE_COPY[type];

  function open() {
    setType(initialType);
    setDate(today);
    setIsOpen(true);
  }

  const otherMonth = date && date.slice(0, 7) !== today.slice(0, 7)
    ? new Intl.DateTimeFormat("es", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
    : null;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex h-12 items-center justify-center rounded-xl px-6 text-sm font-medium transition-colors",
          triggerClassName
        )}
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <Sheet title={copy.title} onClose={() => setIsOpen(false)}>
          <form
            action={async (formData) => {
              await addFinanceEntry(formData);
              setIsOpen(false);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <input type="hidden" name="type" value={type} />

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
              <SegmentedControl
                layoutId={`finance-entry-type-${initialType}`}
                options={TYPE_OPTIONS}
                value={type}
                onChange={setType}
              />

              <div>
                <Label htmlFor="finance-amount">{copy.amountLabel}</Label>
                <div className="flex items-baseline gap-2 rounded-2xl border border-transparent bg-surface-2 px-4 py-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent/15">
                  <span className="text-2xl font-medium text-muted">S/</span>
                  <input
                    id="finance-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step="0.01"
                    placeholder="0.00"
                    required
                    data-autofocus
                    className="w-full min-w-0 [appearance:textfield] bg-transparent text-4xl font-semibold tracking-tight text-foreground tabular-nums outline-none placeholder:text-muted/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">{copy.hint}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="finance-date">Fecha</Label>
                  <Input
                    id="finance-date"
                    name="date"
                    type="date"
                    max={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12"
                    required
                  />
                  {otherMonth && <p className="mt-1.5 text-xs text-warning">Se guardará en {otherMonth}.</p>}
                </div>
                <div>
                  <Label htmlFor="finance-description">Descripción (opcional)</Label>
                  <Input id="finance-description" name="description" placeholder={copy.placeholder} className="h-12" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
              <Button type="button" variant="ghost" className="h-11" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <SubmitButton variant="solid" className="h-11">
                Guardar
              </SubmitButton>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
