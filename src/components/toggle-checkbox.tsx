"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function ToggleCheckbox({
  checked,
  action,
  disabled = false,
}: {
  checked: boolean;
  action: () => Promise<void>;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled || isPending}
      onClick={() => startTransition(() => action())}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface hover:border-accent"
      )}
    >
      {checked && <Check className="size-3.5" />}
    </button>
  );
}
