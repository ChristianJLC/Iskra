"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function setBiweeklyIncome(formData: FormData) {
  const { userId } = await verifySession();

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const biweeklyIncome = Number(formData.get("biweeklyIncome"));

  if (!month || !year || Number.isNaN(biweeklyIncome) || biweeklyIncome < 0) return;

  await prisma.financeSettings.upsert({
    where: { userId_month_year: { userId, month, year } },
    update: { biweeklyIncome },
    create: { userId, month, year, biweeklyIncome },
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
