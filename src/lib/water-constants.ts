export const WATER_GLASS_LITERS = 0.25;
export const WATER_TARGET_LITERS = 2.25;
export const WATER_TARGET_GLASSES = Math.round(WATER_TARGET_LITERS / WATER_GLASS_LITERS);

export type WaterPeriod = "week" | "month" | "year";
export type WaterStatus = "good" | "low" | "very-low";

export type WaterStats = {
  periodLabel: string;
  bars: { key: string; label: string; liters: number; isFuture: boolean }[];
  average: number;
  target: number;
  status: WaterStatus;
  canGoNext: boolean;
};

export function getWaterStatus(average: number, target: number): WaterStatus {
  if (average >= target) return "good";
  if (average >= target * 0.5) return "low";
  return "very-low";
}
