import { cn } from "@/lib/cn";

function clampPercent(percent: number) {
  return Math.min(100, Math.max(0, percent));
}

export function ProgressBar({
  percent,
  className,
  fillClassName = "bg-accent",
}: {
  percent: number;
  className?: string;
  fillClassName?: string;
}) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={cn("bar-fill h-full rounded-full transition-[width] duration-700 ease-out", fillClassName)}
        style={{ width: `${clampPercent(percent)}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 128,
  strokeWidth = 12,
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const value = clampPercent(percent);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={strokeWidth} />
        {value > 0 && (
          <circle
            className="ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            style={{ "--value": value } as React.CSSProperties}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
