import { CHART_ACCENT_GRADIENT_ID } from "@/lib/chart-theme";

export function ChartAccentGradient() {
  return (
    <defs>
      <linearGradient id={CHART_ACCENT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--accent-2)" />
        <stop offset="100%" stopColor="var(--accent)" />
      </linearGradient>
    </defs>
  );
}
