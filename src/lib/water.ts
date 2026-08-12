import "server-only";
import { prisma } from "@/lib/prisma";
import {
  startOfToday,
  getWeekBounds,
  getMonthBounds,
  getYearBounds,
  daysInMonth,
  daysInYear,
  formatShortDateEs,
  formatMonthYearEs,
} from "@/lib/date";
import { WATER_GLASS_LITERS, WATER_TARGET_LITERS, getWaterStatus, type WaterPeriod, type WaterStats } from "@/lib/water-constants";

export { WATER_GLASS_LITERS, WATER_TARGET_LITERS, WATER_TARGET_GLASSES, getWaterStatus } from "@/lib/water-constants";
export type { WaterPeriod, WaterStatus, WaterStats } from "@/lib/water-constants";

export async function getTodayGlasses(userId: string) {
  const entry = await prisma.waterEntry.findUnique({
    where: { userId_date: { userId, date: startOfToday() } },
  });
  return entry?.glasses ?? 0;
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

async function getWeekStats(userId: string, offset: number): Promise<WaterStats> {
  const today = startOfToday();
  const reference = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset * 7);
  const { start, end } = getWeekBounds(reference);
  const isCurrent = offset === 0;

  const entries = await prisma.waterEntry.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });
  const glassesByDate = new Map(entries.map((e) => [e.date.getTime(), e.glasses]));

  const bars = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return {
      key: date.toISOString(),
      label: WEEKDAY_LABELS[i],
      liters: (glassesByDate.get(date.getTime()) ?? 0) * WATER_GLASS_LITERS,
      isFuture: date.getTime() > today.getTime(),
    };
  });

  const elapsedBars = bars.filter((b) => !b.isFuture);
  const sum = elapsedBars.reduce((acc, b) => acc + b.liters, 0);
  const average = elapsedBars.length > 0 ? sum / elapsedBars.length : 0;

  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
  const periodLabel = isCurrent
    ? "Esta semana"
    : `${formatShortDateEs(start)} – ${formatShortDateEs(lastDay)}`;

  return {
    periodLabel,
    bars,
    average,
    target: WATER_TARGET_LITERS,
    status: getWaterStatus(average, WATER_TARGET_LITERS),
    canGoNext: offset < 0,
  };
}

async function getMonthStats(userId: string, offset: number): Promise<WaterStats> {
  const today = startOfToday();
  const totalMonthIndex = today.getFullYear() * 12 + today.getMonth() + offset;
  const year = Math.floor(totalMonthIndex / 12);
  const month = (totalMonthIndex % 12) + 1;
  const isCurrent = offset === 0;

  const { start, end } = getMonthBounds(month, year);
  const entries = await prisma.waterEntry.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });
  const glassesByDate = new Map(entries.map((e) => [e.date.getTime(), e.glasses]));

  const total = daysInMonth(month, year);
  const bars = Array.from({ length: total }, (_, i) => {
    const date = new Date(year, month - 1, i + 1);
    return {
      key: date.toISOString(),
      label: String(i + 1),
      liters: (glassesByDate.get(date.getTime()) ?? 0) * WATER_GLASS_LITERS,
      isFuture: date.getTime() > today.getTime(),
    };
  });

  const elapsedBars = bars.filter((b) => !b.isFuture);
  const sum = elapsedBars.reduce((acc, b) => acc + b.liters, 0);
  const average = elapsedBars.length > 0 ? sum / elapsedBars.length : 0;

  return {
    periodLabel: isCurrent ? "Este mes" : formatMonthYearEs(month, year),
    bars,
    average,
    target: WATER_TARGET_LITERS,
    status: getWaterStatus(average, WATER_TARGET_LITERS),
    canGoNext: offset < 0,
  };
}

const MONTH_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

async function getYearStats(userId: string, offset: number): Promise<WaterStats> {
  const today = startOfToday();
  const year = today.getFullYear() + offset;
  const isCurrent = offset === 0;

  const { start, end } = getYearBounds(year);
  const entries = await prisma.waterEntry.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });

  const litersByMonth = new Array(12).fill(0) as number[];
  for (const entry of entries) {
    litersByMonth[entry.date.getMonth()] += entry.glasses * WATER_GLASS_LITERS;
  }

  const monthsElapsed = isCurrent ? today.getMonth() + 1 : 12;
  const bars = Array.from({ length: 12 }, (_, i) => ({
    key: `${year}-${i}`,
    label: MONTH_LABELS[i],
    liters: litersByMonth[i],
    isFuture: isCurrent && i > today.getMonth(),
  }));

  const daysElapsed = isCurrent
    ? Math.floor((today.getTime() - start.getTime()) / 86400000) + 1
    : daysInYear(year);
  const sum = litersByMonth.slice(0, monthsElapsed).reduce((acc, l) => acc + l, 0);
  const average = daysElapsed > 0 ? sum / daysElapsed : 0;

  return {
    periodLabel: isCurrent ? "Este año" : String(year),
    bars,
    average,
    target: WATER_TARGET_LITERS,
    status: getWaterStatus(average, WATER_TARGET_LITERS),
    canGoNext: offset < 0,
  };
}

export async function getWaterStats(userId: string, period: WaterPeriod, offset: number): Promise<WaterStats> {
  if (period === "week") return getWeekStats(userId, offset);
  if (period === "month") return getMonthStats(userId, offset);
  return getYearStats(userId, offset);
}
