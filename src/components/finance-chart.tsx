"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartAccentGradient } from "@/components/ui/chart-gradient";
import {
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
  CHART_ACCENT_GRADIENT_ID,
} from "@/lib/chart-theme";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export function FinanceChart({
  ingresos,
  extras,
  gastos,
  balance,
}: {
  ingresos: number;
  extras: number;
  gastos: number;
  balance: number;
}) {
  const data = [
    { name: "Ingreso", monto: ingresos },
    { name: "Extra", monto: extras },
    { name: "Gasto", monto: gastos },
    { name: "Balance", monto: balance },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <ChartAccentGradient />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            cursor={{ fill: "var(--surface-2)" }}
            formatter={(value) => [currency.format(Number(value)), "Monto"]}
          />
          <Bar dataKey="monto" fill={`url(#${CHART_ACCENT_GRADIENT_ID})`} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
