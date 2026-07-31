"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton className="w-full">Iniciar sesión</SubmitButton>
    </form>
  );
}
