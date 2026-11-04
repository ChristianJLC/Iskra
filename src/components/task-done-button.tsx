"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";

export function TaskDoneButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="solid"
      disabled={isPending}
      whileHover={isPending ? undefined : { y: -2 }}
      onClick={() => startTransition(() => toggleTask(id, true))}
      className="h-12 w-full bg-white px-6 whitespace-nowrap text-[#14141a] shadow-none hover:bg-white/90 sm:w-auto"
    >
      <Check className="size-4" strokeWidth={3} />
      {isPending ? "Guardando…" : "Marcar como hecha"}
    </Button>
  );
}
