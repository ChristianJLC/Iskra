"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Droplet, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { incrementWater, decrementWater } from "@/actions/water";
import { WATER_GLASS_LITERS, WATER_TARGET_GLASSES, WATER_TARGET_LITERS } from "@/lib/water-constants";

export function WaterCard({ glasses }: { glasses: number }) {
  const [count, setCount] = useState(glasses);
  const [isPending, startTransition] = useTransition();

  const liters = count * WATER_GLASS_LITERS;

  function handleIncrement() {
    setCount((c) => c + 1);
    startTransition(async () => {
      const result = await incrementWater();
      setCount(result);
    });
  }

  function handleDecrement() {
    if (count <= 0) return;
    setCount((c) => Math.max(0, c - 1));
    startTransition(async () => {
      const result = await decrementWater();
      setCount(result);
    });
  }

  return (
    <Card className="space-y-4 rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted">
          <Droplet className="size-4" />
          Agua
        </h2>
        <Link
          href="/comidas/agua"
          prefetch={false}
          className="-mr-1.5 flex items-center gap-0.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Ver historial
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {liters.toFixed(2).replace(/\.?0+$/, "")}
          <span className="ml-1.5 text-sm font-normal tracking-normal text-muted">/ {WATER_TARGET_LITERS} L</span>
        </p>
        <p className="text-sm text-muted tabular-nums">
          {count} de {WATER_TARGET_GLASSES} vasos
        </p>
      </div>

      <div
        className="flex gap-1.5"
        role="img"
        aria-label={`${count} de ${WATER_TARGET_GLASSES} vasos de agua`}
      >
        {Array.from({ length: WATER_TARGET_GLASSES }, (_, i) => (
          <span
            key={i}
            className="relative h-11 flex-1 overflow-hidden bg-surface-2 [clip-path:polygon(0_0,100%_0,86%_100%,14%_100%)]"
          >
            {i < count && (
              <span
                className="water-fill absolute inset-0 bg-accent"
                style={{ "--i": i } as React.CSSProperties}
              />
            )}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[3rem_1fr] gap-2">
        <button
          type="button"
          disabled={isPending || count <= 0}
          onClick={handleDecrement}
          aria-label="Quitar un vaso"
          className="flex h-12 items-center justify-center rounded-xl bg-surface-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleIncrement}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
          Agregar vaso
        </button>
      </div>
    </Card>
  );
}
