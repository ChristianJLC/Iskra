import { daysInMonth, getZonedCalendarDate, type CalendarDate } from "@/lib/date";
import type { BillState } from "@/lib/finance";

const CURRENCY = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const SINGLE_PAYMENT_LABEL = "Pago único";

type BillInput = {
  id: string;
  title: string;
  amount: number;
  state: BillState;
  startDay: number;
  endDay: number | null;
  installmentLabel?: string | null;
  paidOn?: string | null;
};

export type FinanceViewInput = {
  today: CalendarDate;
  monthLabel: string;
  timezone: string;
  entries: { type: string; amount: number; date: Date }[];
  bills: BillInput[];
};

/** Una cuota cuenta como pagada por pagos hechos: si se salta un mes, sigue pendiente hasta pagarla. */
export function resolveInstallment(installments: number | null, totalPaid: number, paidThisMonth: boolean) {
  if (installments == null) return { finished: false, label: null };

  const current = paidThisMonth ? totalPaid : totalPaid + 1;
  return {
    finished: totalPaid >= installments && !paidThisMonth,
    label: installments === 1 ? SINGLE_PAYMENT_LABEL : `Cuota ${current} de ${installments}`,
  };
}

export function describeBill(bill: Omit<BillInput, "id" | "title">, today: number) {
  const prefix = bill.installmentLabel
    ? `${CURRENCY.format(bill.amount)} · ${bill.installmentLabel.toLowerCase()}`
    : CURRENCY.format(bill.amount);

  if (bill.state === "inactive") return `${prefix} · desde el ${bill.startDay}`;
  if (bill.endDay == null && bill.installmentLabel === SINGLE_PAYMENT_LABEL) return `${prefix} · sin fecha`;
  if (bill.endDay == null) return `${prefix} · ya puedes pagarlo`;
  return `${prefix} · ${today > bill.endDay ? "venció" : "vence"} el ${bill.endDay}`;
}

export function describePaidBill(paidOn?: string | null, installmentLabel?: string | null) {
  const paid = paidOn ? `Pagado el ${paidOn}` : "Pagado";
  return installmentLabel ? `${paid} · ${installmentLabel.toLowerCase()}` : paid;
}

function sumByType(entries: FinanceViewInput["entries"], type: string) {
  return entries.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0);
}

const BILL_ORDER: Record<BillState, number> = { urgent: 0, active: 1, inactive: 2, paid: 3 };

export function buildFinanceView({ today, monthLabel, timezone, entries, bills }: FinanceViewInput) {
  const salary = sumByType(entries, "INGRESO");
  const extras = sumByType(entries, "EXTRA");
  const spent = sumByType(entries, "GASTO");
  const received = salary + extras;
  const balance = received - spent;

  const unpaid = bills.filter((bill) => bill.state !== "paid");
  const pendingAmount = unpaid.reduce((sum, bill) => sum + bill.amount, 0);

  const spendingByDay = new Map<number, number>();
  for (const entry of entries) {
    if (entry.type !== "GASTO") continue;
    const { day } = getZonedCalendarDate(timezone, entry.date);
    spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + entry.amount);
  }
  const days = Array.from({ length: daysInMonth(today.month, today.year) }, (_, i) => ({
    day: i + 1,
    amount: spendingByDay.get(i + 1) ?? 0,
    isToday: i + 1 === today.day,
    isFuture: i + 1 > today.day,
  }));
  const peak = days.reduce((max, day) => (day.amount > max.amount ? day : max), days[0]);

  return {
    monthName: new Intl.DateTimeFormat("es", { month: "long" }).format(new Date(today.year, today.month - 1, 1)),
    monthLabel,
    salary,
    extras,
    spent,
    received,
    balance,
    spentPercent: received > 0 ? (spent / received) * 100 : 0,
    hasSalary: salary > 0,
    afterBills: balance - pendingAmount,
    pendingAmount,
    pendingCount: unpaid.length,
    billsTotal: bills.length,
    bills: [...bills]
      .sort((a, b) => BILL_ORDER[a.state] - BILL_ORDER[b.state])
      .map((bill) => ({
        id: bill.id,
        title: bill.title,
        state: bill.state,
        detail:
          bill.state === "paid" ? describePaidBill(bill.paidOn, bill.installmentLabel) : describeBill(bill, today.day),
      })),
    days,
    peak: peak.amount > 0 ? peak : null,
  };
}

export type FinanceView = ReturnType<typeof buildFinanceView>;
