"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

const inputClasses =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent md:text-sm";

export function Input({
  className,
  icon,
  ...props
}: ComponentProps<"input"> & { icon?: ReactNode }) {
  const input = (
    <input
      className={cn(inputClasses, icon && "pl-10", className)}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        {icon}
      </span>
      {input}
    </div>
  );
}

export function PasswordInput({
  className,
  icon,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { icon?: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
      )}
      <input
        type={visible ? "text" : "password"}
        className={cn(inputClasses, icon && "pl-10", "pr-10", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1 text-xs text-danger">
      {messages.join(" ")}
    </p>
  );
}
