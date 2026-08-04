"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Play, Pause, Check } from "lucide-react";
import { startTimer, pauseTimer } from "@/actions/studies";
import { cn } from "@/lib/cn";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function StudyTimer({
  id,
  initialSeconds,
  isRunning,
  targetMinutes,
  completed,
}: {
  id: string;
  initialSeconds: number;
  isRunning: boolean;
  targetMinutes: number;
  completed: boolean;
}) {
  const targetSeconds = targetMinutes * 60;
  const [seconds, setSeconds] = useState(Math.min(initialSeconds, targetSeconds));
  const [isPending, startTransition] = useTransition();
  const autoStoppedRef = useRef(false);

  useEffect(() => {
    setSeconds(Math.min(initialSeconds, targetSeconds));
    autoStoppedRef.current = false;
  }, [initialSeconds, targetSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((s) => Math.min(s + 1, targetSeconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, targetSeconds]);

  useEffect(() => {
    if (isRunning && seconds >= targetSeconds && !autoStoppedRef.current) {
      autoStoppedRef.current = true;
      startTransition(() => pauseTimer(id));
    }
  }, [isRunning, seconds, targetSeconds, id]);

  const minutes = Math.floor(seconds / 60);
  const progress = Math.min(100, Math.round((minutes / targetMinutes) * 100));

  return (
    <div className="space-y-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3">
        {completed ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent bg-accent/15 text-accent">
            <Check className="size-4" />
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => (isRunning ? pauseTimer(id) : startTimer(id)))}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              isRunning
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface text-foreground hover:border-accent"
            )}
          >
            {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}
        <p className="font-mono text-sm text-foreground">{formatClock(seconds)}</p>
        <p className="text-xs text-muted">
          {completed ? "Completado · " : ""}
          {minutes} / {targetMinutes} min
        </p>
      </div>
    </div>
  );
}
