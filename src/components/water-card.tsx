"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, GlassWater, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { incrementWater, decrementWater } from "@/actions/water";
import { WATER_GLASS_LITERS, WATER_TARGET_GLASSES, WATER_TARGET_LITERS } from "@/lib/water-constants";
import { cn } from "@/lib/cn";

export function WaterCard({ glasses }: { glasses: number }) {
  const [count, setCount] = useState(glasses);
  const [isPending, startTransition] = useTransition();

  const liters = count * WATER_GLASS_LITERS;
  const percent = Math.min(100, (count / WATER_TARGET_GLASSES) * 100);

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
    <Card className="space-y-4">
      <Link href="/comidas/agua" prefetch={false} className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Agua</h2>
        <ChevronRight className="size-5 text-muted" />
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 shadow-glow">
            <GlassWater className="size-5 text-white" />
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {liters.toFixed(2).replace(/\.?0+$/, "")}
            <span className="text-base font-normal text-muted"> / {WATER_TARGET_LITERS} L</span>
          </p>
        </div>
        <p className="text-sm text-muted">
          {count} de {WATER_TARGET_GLASSES} vasos
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isPending || count <= 0}
          onClick={handleDecrement}
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-2 py-3 text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleIncrement}
          className="flex items-center justify-center rounded-full bg-surface-2 py-3 text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </Card>
  );
}
