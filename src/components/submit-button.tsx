"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";

export function SubmitButton({
  children,
  disabled,
  pendingLabel = "Guardando…",
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
