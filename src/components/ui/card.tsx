import { type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "flat" | "raised" | "glass";

const variants: Record<Variant, string> = {
  flat: "bg-surface border border-border",
  raised: "bg-surface-1 border border-border/60 shadow-soft",
  glass: "glass",
};

export function Card({
  className,
  variant = "raised",
  ...props
}: ComponentProps<"div"> & { variant?: Variant }) {
  return (
    <div
      className={cn("rounded-2xl p-5", variants[variant], className)}
      {...props}
    />
  );
}
