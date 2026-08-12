export const CHART_ACCENT_GRADIENT_ID = "chart-accent-gradient";

export const chartTooltipStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "var(--shadow-soft)",
  padding: "8px 12px",
} as const;

export const chartTooltipLabelStyle = {
  color: "var(--foreground)",
  fontWeight: 600,
  marginBottom: 2,
} as const;

export const chartTooltipItemStyle = {
  color: "var(--muted)",
} as const;
