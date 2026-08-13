"use client";

import { useActionState } from "react";
import { Mail, Lock } from "lucide-react";
import { login } from "@/actions/auth";
import { Input, PasswordInput, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          icon={<Lock className="size-4" />}
          required
        />
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton className="w-full" variant="gradient">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
