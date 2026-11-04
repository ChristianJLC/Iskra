"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

const formatters = {
  number: (value: number) => Math.round(value).toLocaleString("es"),
  currency: (value: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value),
};

export function CountUp({ value, format = "number" }: { value: number; format?: keyof typeof formatters }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const controls = animate(from.current, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        from.current = latest;
        if (ref.current) ref.current.textContent = formatters[format](latest);
      },
    });
    return () => controls.stop();
  }, [value, format, reduced]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {formatters[format](value)}
    </span>
  );
}
