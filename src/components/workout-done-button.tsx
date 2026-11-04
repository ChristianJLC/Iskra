"use client";

import { useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { markWorkoutDone, unmarkWorkoutDone } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { CalendarDate } from "@/lib/date";

export function WorkoutDoneButton({ cal, completed }: { cal: CalendarDate; completed: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() =>
      completed
        ? unmarkWorkoutDone(cal.year, cal.month, cal.day)
        : markWorkoutDone(cal.year, cal.month, cal.day)
    );
  }

  return (
    <Button
      type="button"
      variant="solid"
      disabled={isPending}
      whileHover={isPending ? undefined : { y: -2 }}
      onClick={toggle}
      className={cn(
        "h-12 w-full px-6 shadow-none sm:w-auto",
        completed ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-[#14141a] hover:bg-white/90"
      )}
    >
      {completed ? <RotateCcw className="size-4" /> : <Check className="size-4" strokeWidth={3} />}
      {isPending ? "Guardando…" : completed ? "Deshacer" : "Marcar como hecho"}
    </Button>
  );
}
