import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getMonthBounds, daysInMonth, getZonedCalendarDate, calendarDateToUtc } from "@/lib/date";

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
      where: { userId, date: { gte: start, lt: end }, recurringBillId: { not: null } },
      select: { recurringBillId: true },
    }),
  ]);

  const paidBillIds = new Set(payments.map((p) => p.recurringBillId));

  return bills
    .map((bill) => {
      const paid = paidBillIds.has(bill.id);
      return { ...bill, paid, state: getBillState(bill, today, paid, monthDayCount) };
    })
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.startDay - b.startDay);
}

export async function ensureQuincenaIngresos(userId: string, timezone: string) {
  const { year, month, day: currentDay } = getZonedCalendarDate(timezone);

  let settings = await prisma.financeSettings.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  if (!settings) {
    const previous = await prisma.financeSettings.findFirst({
      where: { userId, OR: [{ year: { lt: year } }, { year, month: { lt: month } }] },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    if (previous) {
      settings = await prisma.financeSettings.create({
        data: {
          userId,
          month,
          year,
          biweeklyIncome: previous.biweeklyIncome,
          incomeFrequency: previous.incomeFrequency,
        },
      });
    }
  }

  const amount = settings ? Number(settings.biweeklyIncome) : 0;
  if (amount <= 0) return;

  const isMonthly = settings?.incomeFrequency === "MENSUAL";
  const dueDays = isMonthly ? [1] : currentDay >= 16 ? [1, 16] : [1];

  for (const day of dueDays) {
    const date = calendarDateToUtc(timezone, { year, month, day });
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const exists = await prisma.financeEntry.findFirst({
      where: { userId, type: "INGRESO", date: { gte: date, lt: nextDay } },
    });

    if (!exists) {
      await prisma.financeEntry.create({
        data: {
          userId,
          type: "INGRESO",
          amount,
          date,
          description: isMonthly
            ? "Pago mensual"
            : day === 1
              ? "Pago quincenal (1-15)"
              : "Pago quincenal (16-fin de mes)",
        },
      });
    }
  }
}
