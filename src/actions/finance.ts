"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getMonthBounds } from "@/lib/date";

export async function setFixedIncome(formData: FormData) {
  const { userId } = await verifySession();

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const biweeklyIncome = Number(formData.get("biweeklyIncome"));
  const incomeFrequencyRaw = formData.get("incomeFrequency") as string;

  if (!month || !year || Number.isNaN(biweeklyIncome) || biweeklyIncome < 0) return;
  if (!["QUINCENAL", "MENSUAL"].includes(incomeFrequencyRaw)) return;
  const incomeFrequency = incomeFrequencyRaw as "QUINCENAL" | "MENSUAL";

  await prisma.financeSettings.upsert({
    where: { userId_month_year: { userId, month, year } },
    update: { biweeklyIncome, incomeFrequency },
    create: { userId, month, year, biweeklyIncome, incomeFrequency },
  });

  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function addFinanceEntry(formData: FormData) {
  const { userId } = await verifySession();

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string)?.trim();

  if (!["EXTRA", "GASTO"].includes(type)) return;
  if (Number.isNaN(amount) || amount <= 0) return;

  await prisma.financeEntry.create({
    data: {
      userId,
      type: type as "EXTRA" | "GASTO",
      amount,
      description: description || null,
    },
  });

  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function deleteFinanceEntry(id: string) {
  const { userId } = await verifySession();

  await prisma.financeEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/finanzas");
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

  if (!title) return;
  if (Number.isNaN(amount) || amount <= 0) return;
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > 31) return;
  if (endDay !== null && (!Number.isInteger(endDay) || endDay < startDay || endDay > 31)) return;

  await prisma.recurringBill.create({
    data: {
      userId,
      title,
      description: description || null,
      amount,
      priority: priority as "BAJA" | "MEDIA" | "ALTA",
      startDay,
      endDay,
    },
  });

  revalidatePath("/finanzas/pagos");
}

export async function deleteRecurringBill(id: string) {
  const { userId } = await verifySession();

  await prisma.recurringBill.deleteMany({ where: { id, userId } });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial");
}

export async function markBillPaid(billId: string) {
  const { userId } = await verifySession();

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, userId } });
  if (!bill) return;

  const now = new Date();
  const { start, end } = getMonthBounds(now.getMonth() + 1, now.getFullYear());

  const alreadyPaid = await prisma.financeEntry.findFirst({
    where: { userId, recurringBillId: billId, date: { gte: start, lt: end } },
  });
  if (alreadyPaid) return;

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

  const now = new Date();
  const { start, end } = getMonthBounds(now.getMonth() + 1, now.getFullYear());

  await prisma.financeEntry.deleteMany({
    where: { userId, recurringBillId: billId, date: { gte: start, lt: end } },
  });

  revalidatePath("/finanzas/pagos");
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/historial");
  revalidatePath("/");
}
