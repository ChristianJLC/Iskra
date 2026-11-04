const ARC_PATH = "M 20 120 A 100 100 0 0 1 220 120";

function percentOf(value: number, domainMax: number) {
  return domainMax > 0 ? Math.min(100, Math.max(0, (value / domainMax) * 100)) : 0;
}

export function CalorieGauge({
  consumed,
  rangeMin,
  rangeMax,
  children,
}: {
  consumed: number;
  rangeMin: number;
  rangeMax: number;
  children?: React.ReactNode;
}) {
  const domainMax = rangeMax * 1.2;
  const rangeStart = percentOf(rangeMin, domainMax);
  const rangeLength = percentOf(rangeMax, domainMax) - rangeStart;
  const value = percentOf(consumed, domainMax);
  const over = consumed > rangeMax;

  return (
    <div className="relative mx-auto w-full max-w-[22rem]">
      <svg
        viewBox="0 0 240 132"
        role="img"
        aria-label={`${Math.round(consumed)} kcal consumidas. Tu rango es de ${rangeMin} a ${rangeMax} kcal.`}
        className="block w-full"
      >
        <path d={ARC_PATH} fill="none" stroke="var(--surface-2)" strokeWidth={16} strokeLinecap="round" />
        <path
          d={ARC_PATH}
          fill="none"
          stroke="color-mix(in srgb, var(--accent) 28%, transparent)"
          strokeWidth={16}
          pathLength={100}
          strokeDasharray={`${rangeLength} 100`}
          strokeDashoffset={-rangeStart}
        />
        {value > 0 && (
          <path
            className="ring-fill"
            d={ARC_PATH}
            fill="none"
            stroke={over ? "var(--danger)" : "var(--accent)"}
            strokeWidth={16}
            strokeLinecap="round"
            pathLength={100}
            style={{ "--value": value } as React.CSSProperties}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">{children}</div>
    </div>
  );
}
