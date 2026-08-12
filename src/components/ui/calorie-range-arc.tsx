"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const CENTER_T = 0.5;
const RANGE_OFFSET = 350;

function pointOnArc(t: number, baseY: number, peakY: number) {
  const x = 2 + t * 96;
  const y = baseY * ((1 - t) ** 2 + t ** 2) + 2 * peakY * t * (1 - t);
  return { x, y };
}

export function CalorieRangeArc({
  consumed,
  target,
  revealed = true,
  height = 40,
  className,
}: {
  consumed: number;
  target: number;
  revealed?: boolean;
  height?: number;
  className?: string;
}) {
  const gradientId = useId();
  const baseY = height * 0.75;
  const peakY = height * 0.12;
  const strokeWidth = Math.max(3, height * 0.13);

  // el objetivo (target) queda justo a la mitad del arco, invisible para el
  // usuario. Las marcas van a ±350 kcal del objetivo, en su posición real —
  // de ahí en adelante es "exceso" y el degradado pasa a naranja (hasta la
  // marca de máximo) y luego a rojo
  const domainMax = target * 2;
  const rangeMin = target - RANGE_OFFSET;
  const rangeMax = target + RANGE_OFFSET;
  const minT = domainMax > 0 ? Math.max(0, Math.min(1, rangeMin / domainMax)) : 0;
  const maxT = domainMax > 0 ? Math.max(0, Math.min(1, rangeMax / domainMax)) : 1;

  const rawFillPercent = domainMax > 0 ? Math.min(100, (consumed / domainMax) * 100) : 0;
  const fillPercent = revealed ? rawFillPercent : 0;

  const path = `M 2 ${baseY} Q 50 ${peakY} 98 ${baseY}`;
  const minPoint = pointOnArc(minT, baseY, peakY);
  const maxPoint = pointOnArc(maxT, baseY, peakY);
  const markerHeight = strokeWidth * 1.7;
  const maxTPercent = maxT * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d={path}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className="absolute inset-0 transition-[clip-path] duration-700 ease-out"
          style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
        >
          <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent-2)" />
                <stop offset={`${CENTER_T * 100}%`} stopColor="var(--accent)" />
                <stop offset={`${CENTER_T * 100}%`} stopColor="var(--warning)" />
                <stop offset={`${maxTPercent}%`} stopColor="var(--warning)" />
                <stop offset={`${maxTPercent}%`} stopColor="var(--danger)" />
                <stop offset="100%" stopColor="var(--danger)" />
              </linearGradient>
            </defs>
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/70"
          style={{ left: `${minPoint.x}%`, top: minPoint.y, width: 3, height: markerHeight }}
        />
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/70"
          style={{ left: `${maxPoint.x}%`, top: maxPoint.y, width: 3, height: markerHeight }}
        />
      </div>
      <div className="relative h-4 text-xs font-medium text-muted">
        <span className="absolute -translate-x-1/2" style={{ left: `${minT * 100}%` }}>
          {Math.round(rangeMin).toLocaleString("es")}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${maxT * 100}%` }}>
          {Math.round(rangeMax).toLocaleString("es")}
        </span>
      </div>
    </div>
  );
}
