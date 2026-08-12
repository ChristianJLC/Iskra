"use client";

import { useState, useTransition } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ChartAccentGradient } from "@/components/ui/chart-gradient";
import { cn } from "@/lib/cn";
import {
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
  CHART_ACCENT_GRADIENT_ID,
} from "@/lib/chart-theme";
import { fetchWaterStats } from "@/actions/water";
import { WATER_TARGET_LITERS, type WaterPeriod, type WaterStats } from "@/lib/water-constants";

const TABS: { key: WaterPeriod; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

const AVERAGE_LABELS: Record<WaterPeriod, string> = {
  week: "Promedio Semanal",
  month: "Promedio Mensual",
  year: "Promedio Anual",
};

const STATUS_TEXT: Record<WaterStats["status"], string> = {
  good: "Buen ritmo",
  low: "Bajo",
  "very-low": "Muy bajo",
};

const STATUS_CLASS: Record<WaterStats["status"], string> = {
  good: "text-accent",
  low: "text-warning",
  "very-low": "text-danger",
};

export function WaterStatsView({ initialStats }: { initialStats: WaterStats }) {
  const [period, setPeriod] = useState<WaterPeriod>("week");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  function loadStats(nextPeriod: WaterPeriod, nextOffset: number) {
    setPeriod(nextPeriod);
    setOffset(nextOffset);
    startTransition(async () => {
      const result = await fetchWaterStats(nextPeriod, nextOffset);
      setStats(result);
    });
  }

  const barInterval = stats.bars.length > 12 ? Math.floor(stats.bars.length / 8) : 0;

  return (
    <div className="space-y-4">
      <SegmentedControl
        layoutId="water-period-indicator"
        options={TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
        value={period}
        onChange={(next) => loadStats(next, 0)}
      />

      <Card className={cn("space-y-6", isPending && "opacity-60")}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => loadStats(period, offset - 1)}
            className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-sm font-medium text-foreground">{stats.periodLabel}</p>
          <button
            type="button"
            disabled={!stats.canGoNext}
            onClick={() => loadStats(period, offset + 1)}
            className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted">{AVERAGE_LABELS[period]}</p>
          <p className="text-4xl font-semibold text-foreground">
            {stats.average.toFixed(2)}
            <span className="text-lg font-normal text-muted"> L</span>
          </p>
          <p className={cn("flex items-center justify-center gap-1.5 text-sm font-medium", STATUS_CLASS[stats.status])}>
            <Flag className="size-3.5" />
            {STATUS_TEXT[stats.status]}
          </p>
          <p className="text-xs text-muted">Objetivo: Mín. {WATER_TARGET_LITERS} L</p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.bars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <ChartAccentGradient />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={barInterval}
              />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                cursor={{ fill: "var(--surface-2)" }}
                formatter={(value) => [`${Number(value).toFixed(2)} L`, "Agua"]}
              />
              <Bar dataKey="liters" radius={[8, 8, 0, 0]}>
                {stats.bars.map((bar) => (
                  <Cell
                    key={bar.key}
                    fill={
                      bar.isFuture
                        ? "var(--border)"
                        : bar.liters >= stats.target
                          ? `url(#${CHART_ACCENT_GRADIENT_ID})`
                          : "var(--danger)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
