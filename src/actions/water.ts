"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { startOfToday } from "@/lib/date";
import { getWaterStats, type WaterPeriod } from "@/lib/water";

export async function incrementWater() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const date = startOfToday(timezone);

  const entry = await prisma.waterEntry.upsert({
    where: { userId_date: { userId, date } },
    update: { glasses: { increment: 1 } },
    create: { userId, date, glasses: 1 },
  });

  revalidatePath("/comidas");
  revalidatePath("/comidas/agua");
  revalidatePath("/");
  return entry.glasses;
}

export async function decrementWater() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const date = startOfToday(timezone);

  const existing = await prisma.waterEntry.findUnique({ where: { userId_date: { userId, date } } });
  if (!existing || existing.glasses <= 0) return 0;

  const entry = await prisma.waterEntry.update({
    where: { userId_date: { userId, date } },
    data: { glasses: { decrement: 1 } },
  });

  revalidatePath("/comidas");
  revalidatePath("/comidas/agua");
  revalidatePath("/");
  return entry.glasses;
}

export async function fetchWaterStats(period: WaterPeriod, offset: number) {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  return getWaterStats(userId, timezone, period, offset);
}
