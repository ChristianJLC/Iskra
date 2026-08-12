"use client";

import { type ComponentProps } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gradient";
type MotionButtonProps = ComponentProps<typeof motion.button>;

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-surface-hover",
  ghost: "text-muted hover:text-foreground hover:bg-surface-hover",
  danger: "bg-danger text-white hover:opacity-90",
  gradient:
    "bg-gradient-to-br from-accent to-accent-2 text-accent-foreground shadow-glow hover:opacity-90 disabled:opacity-50",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: MotionButtonProps & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
