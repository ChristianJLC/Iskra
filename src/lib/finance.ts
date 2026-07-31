import "server-only";
import { prisma } from "@/lib/prisma";

export async function ensureQuincenaIngresos(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const settings = await prisma.financeSettings.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  const amount = settings ? Number(settings.biweeklyIncome) : 0;
  if (amount <= 0) return;

  const dueDays = now.getDate() >= 16 ? [1, 16] : [1];

  for (const day of dueDays) {
    const date = new Date(year, month - 1, day);
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
          description: day === 1 ? "Pago quincenal (1-15)" : "Pago quincenal (16-fin de mes)",
        },
      });
    }
  }
}
