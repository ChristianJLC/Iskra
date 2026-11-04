import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { formatShortDateEs, getMonthBounds, daysInMonth, getZonedCalendarDate } from "@/lib/date";
import { resolveInstallment } from "@/lib/finance-summary";

type FinanceAmountEntry = {
  type: string;
  amount: number | Prisma.Decimal;
};

export function getMonthTotals(entries: FinanceAmountEntry[]) {
  const ingresos = entries
    .filter((e) => e.type === "INGRESO")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const extras = entries
    .filter((e) => e.type === "EXTRA")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const gastos = entries
    .filter((e) => e.type === "GASTO")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = ingresos + extras - gastos;

  return { ingresos, extras, gastos, balance };
}

export async function getHistorialMonths(
  userId: string,
  excludeMonth: number,
  excludeYear: number,
  timezone: string
) {
  const entries = await prisma.financeEntry.findMany({
    where: { userId },
    select: { date: true, type: true, amount: true },
  });

  const byMonth = new Map<string, { month: number; year: number; entries: FinanceAmountEntry[] }>();

  for (const entry of entries) {
    const { month, year } = getZonedCalendarDate(timezone, entry.date);
    if (month === excludeMonth && year === excludeYear) continue;

    const key = `${year}-${month}`;
    const bucket = byMonth.get(key) ?? { month, year, entries: [] };
    bucket.entries.push({ type: entry.type, amount: entry.amount });
    byMonth.set(key, bucket);
  }

  return Array.from(byMonth.values())
    .map(({ month, year, entries }) => ({ month, year, ...getMonthTotals(entries) }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export type BillState = "inactive" | "active" | "urgent" | "paid";

export function getBillState(
  bill: { startDay: number; endDay: number | null },
  today: number,
  paid: boolean,
  monthDayCount: number
): BillState {
  if (paid) return "paid";
  const startDay = Math.min(bill.startDay, monthDayCount);
  const endDay = bill.endDay != null ? Math.min(bill.endDay, monthDayCount) : null;
  if (today < startDay) return "inactive";
  if (endDay != null && today >= endDay - 2) return "urgent";
  return "active";
}

const PRIORITY_WEIGHT: Record<string, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

export async function getBillsWithState(userId: string, timezone: string) {
  const { year, month, day: today } = getZonedCalendarDate(timezone);
  const monthDayCount = daysInMonth(month, year);
  const { start, end } = getMonthBounds(timezone, month, year);

  const [bills, payments] = await Promise.all([
    prisma.recurringBill.findMany({ where: { userId } }),
    prisma.financeEntry.findMany({
      where: { userId, recurringBillId: { not: null } },
      select: { recurringBillId: true, date: true },
    }),
  ]);

  const paidThisMonth = new Map<string | null, Date>();
  const totalPaid = new Map<string | null, number>();
  for (const { recurringBillId, date } of payments) {
    totalPaid.set(recurringBillId, (totalPaid.get(recurringBillId) ?? 0) + 1);
    if (date >= start && date < end) paidThisMonth.set(recurringBillId, date);
  }

  return bills
    .map((bill) => {
      const paidDate = paidThisMonth.get(bill.id);
      const paid = Boolean(paidDate);
      const installment = resolveInstallment(bill.installments, totalPaid.get(bill.id) ?? 0, paid);
      return {
        ...bill,
        paid,
        paidOn: paidDate ? formatShortDateEs(paidDate, timezone) : null,
        finished: installment.finished,
        installmentLabel: installment.label,
        state: getBillState(bill, today, paid, monthDayCount),
      };
    })
    .filter((bill) => !bill.finished)
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.startDay - b.startDay);
}
