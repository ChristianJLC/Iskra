"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { calendarDateToUtc, compareCalendarDates, getMonthBounds, getZonedCalendarDate } from "@/lib/date";

function parseEntryDate(raw: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;

  const cal = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(cal.year, cal.month - 1, cal.day));
  if (check.getUTCMonth() !== cal.month - 1 || check.getUTCDate() !== cal.day) return null;
  if (compareCalendarDates(cal, getZonedCalendarDate(timezone)) > 0) return null;

  return calendarDateToUtc(timezone, cal);
}

export async function addFinanceEntry(formData: FormData) {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string)?.trim();
  const date = parseEntryDate((formData.get("date") as string) ?? "", timezone);

  if (!["INGRESO", "EXTRA", "GASTO"].includes(type)) return;
  if (Number.isNaN(amount) || amount <= 0) return;
  if (!date) return;

  await prisma.financeEntry.create({
    data: {
      userId,
      type: type as "INGRESO" | "EXTRA" | "GASTO",
      amount,
      date,
      description: description || null,
    },
  });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial", "layout");
  revalidatePath("/");
}

export async function deleteFinanceEntry(id: string) {
  const { userId } = await verifySession();

  await prisma.financeEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial", "layout");
  revalidatePath("/");
}

export async function addRecurringBill(formData: FormData) {
  const { userId } = await verifySession();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const amount = Number(formData.get("amount"));
  const priority = (formData.get("priority") as string) || "MEDIA";
  const startDay = Number(formData.get("startDay"));
  const endDayRaw = formData.get("endDay") as string;
  const endDay = endDayRaw ? Number(endDayRaw) : null;
  const installmentsRaw = formData.get("installments") as string | null;
  const installments = installmentsRaw ? Number(installmentsRaw) : null;

  if (!title) return;
  if (Number.isNaN(amount) || amount <= 0) return;
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > 31) return;
  if (endDay !== null && (!Number.isInteger(endDay) || endDay < startDay || endDay > 31)) return;
  if (installments !== null && (!Number.isInteger(installments) || installments < 1 || installments > 120)) return;

  await prisma.recurringBill.create({
    data: {
      userId,
      title,
      description: description || null,
      amount,
      priority: priority as "BAJA" | "MEDIA" | "ALTA",
      startDay,
      endDay,
      installments,
    },
  });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function deleteRecurringBill(id: string) {
  const { userId } = await verifySession();

  await prisma.recurringBill.deleteMany({ where: { id, userId } });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial");
  revalidatePath("/");
}

export async function markBillPaid(billId: string) {
  const { userId } = await verifySession();

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, userId } });
  if (!bill) return;

  const timezone = await getUserTimezone();
  const { year, month } = getZonedCalendarDate(timezone);
  const { start, end } = getMonthBounds(timezone, month, year);

  const alreadyPaid = await prisma.financeEntry.findFirst({
    where: { userId, recurringBillId: billId, date: { gte: start, lt: end } },
  });
  if (alreadyPaid) return;

  if (bill.installments != null) {
    const paidCount = await prisma.financeEntry.count({ where: { userId, recurringBillId: billId } });
    if (paidCount >= bill.installments) return;
  }

  await prisma.financeEntry.create({
    data: {
      userId,
      type: "GASTO",
      amount: bill.amount,
      description: bill.title,
      recurringBillId: bill.id,
    },
  });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial");
  revalidatePath("/");
}

export async function unmarkBillPaid(billId: string) {
  const { userId } = await verifySession();

  const timezone = await getUserTimezone();
  const { year, month } = getZonedCalendarDate(timezone);
  const { start, end } = getMonthBounds(timezone, month, year);

  await prisma.financeEntry.deleteMany({
    where: { userId, recurringBillId: billId, date: { gte: start, lt: end } },
  });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial");
  revalidatePath("/");
}
