"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addRecurringBill } from "@/actions/finance";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/submit-button";

type Priority = "BAJA" | "MEDIA" | "ALTA";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
];

type Plan = "MENSUAL" | "CUOTAS" | "UNICO";

const PLAN_OPTIONS: { value: Plan; label: string }[] = [
  { value: "MENSUAL", label: "Mensual" },
  { value: "CUOTAS", label: "Por cuotas" },
  { value: "UNICO", label: "Pago único" },
];

function lastPaymentLabel(installments: number) {
  const now = new Date();
  return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
    new Date(now.getFullYear(), now.getMonth() + installments - 1, 1)
  );
}

export function RecurringBillForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const [plan, setPlan] = useState<Plan>("MENSUAL");
  const [installments, setInstallments] = useState("");

  function open() {
    setPriority("MEDIA");
    setPlan("MENSUAL");
    setInstallments("");
    setIsOpen(true);
  }

  const installmentCount = Number(installments);
  const validInstallments = Number.isInteger(installmentCount) && installmentCount >= 2 && installmentCount <= 120;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Agregar pago
      </button>

      {isOpen && (
        <Sheet
          title="Nuevo pago"
          description="Un servicio, unas cuotas o una deuda que tienes pendiente."
          onClose={() => setIsOpen(false)}
        >
          <form
            action={async (formData) => {
              await addRecurringBill(formData);
              setIsOpen(false);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <input type="hidden" name="priority" value={priority} />

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bill-title">Nombre</Label>
                  <Input id="bill-title" name="title" placeholder="Ej. Gimnasio" className="h-12" required data-autofocus />
                </div>
                <div>
                  <Label htmlFor="bill-amount">Monto</Label>
                  <Input
                    id="bill-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step="0.01"
                    placeholder="0.00"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>¿Cómo lo pagas?</Label>
                <SegmentedControl layoutId="bill-plan" options={PLAN_OPTIONS} value={plan} onChange={setPlan} />
              </div>

              {plan === "CUOTAS" && (
                <div className="reveal">
                  <Label htmlFor="bill-installments">Cuotas que te faltan</Label>
                  <Input
                    id="bill-installments"
                    name="installments"
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={120}
                    step={1}
                    placeholder="Ej. 2"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="h-12"
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    {validInstallments
                      ? `Contando este mes, tu último pago sería en ${lastPaymentLabel(installmentCount)}. Al pagarlo, desaparece solo.`
                      : "Contando este mes. Al pagar la última, desaparece solo."}
                  </p>
                </div>
              )}

              {plan === "UNICO" ? (
                <>
                  <input type="hidden" name="installments" value="1" />
                  <input type="hidden" name="startDay" value="1" />
                  <p className="reveal rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">
                    Sin fecha. Queda pendiente hasta que lo marques como pagado y luego desaparece solo.
                  </p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bill-start">Disponible desde el día</Label>
                      <Input id="bill-start" name="startDay" type="number" min={1} max={31} placeholder="Ej. 16" className="h-12" required />
                    </div>
                    <div>
                      <Label htmlFor="bill-end">Vence el día (opcional)</Label>
                      <Input id="bill-end" name="endDay" type="number" min={1} max={31} placeholder="Ej. 21" className="h-12" />
                    </div>
                  </div>
                  <p className="-mt-2 text-xs text-muted">
                    Si pones el vencimiento, te avisamos en rojo los últimos días. En meses más cortos se ajusta solo al último día.
                  </p>
                </>
              )}

              <div>
                <Label>Prioridad</Label>
                <SegmentedControl
                  layoutId="bill-priority"
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={setPriority}
                />
              </div>

              <div>
                <Label htmlFor="bill-description">Descripción (opcional)</Label>
                <Input id="bill-description" name="description" placeholder="Detalles adicionales" className="h-12" />
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
