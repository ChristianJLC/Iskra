"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const STREAK_GOAL_DAYS = 30;

const EMBERS = [
  { left: "10%", size: 4, rise: -24, duration: 1.7, delay: 0 },
  { left: "24%", size: 5.5, rise: -30, duration: 2.1, delay: 0.3 },
  { left: "38%", size: 3, rise: -20, duration: 1.5, delay: 0.6 },
  { left: "50%", size: 5, rise: -28, duration: 1.9, delay: 0.15 },
  { left: "62%", size: 3.5, rise: -22, duration: 1.6, delay: 0.9 },
  { left: "74%", size: 5, rise: -32, duration: 2.2, delay: 0.45 },
  { left: "86%", size: 4, rise: -24, duration: 1.8, delay: 1.1 },
  { left: "32%", size: 3, rise: -18, duration: 1.4, delay: 1.3 },
  { left: "68%", size: 4.5, rise: -26, duration: 2, delay: 0.75 },
  { left: "18%", size: 3, rise: -20, duration: 1.6, delay: 1.5 },
];

function FlameEmbers() {
  return (
    <>
      {EMBERS.map((ember, i) => (
        <motion.span
          key={i}
          className="absolute bottom-2 rounded-full bg-gradient-to-t from-accent-2 to-accent"
          style={{
            left: ember.left,
            width: ember.size,
            height: ember.size,
            boxShadow: "0 0 6px 1px var(--accent-glow)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: ember.rise, opacity: [0, 1, 0] }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

export function ExerciseStreak({ streak }: { streak: number }) {
  const percent = Math.min(100, (streak / STREAK_GOAL_DAYS) * 100);
  const isActive = streak > 0;

  return (
    <Card className="flex items-center gap-4">
      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center overflow-visible rounded-2xl",
          isActive
            ? "bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow animate-pulse-glow"
            : "bg-surface-2 text-muted"
        )}
      >
        <Flame className="relative size-5" />
        {isActive && <FlameEmbers />}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          {isActive ? `${streak} día${streak === 1 ? "" : "s"} seguidos` : "Empieza tu racha hoy"}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
