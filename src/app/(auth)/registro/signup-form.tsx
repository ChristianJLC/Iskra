"use client";

import { useActionState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { signup } from "@/actions/auth";
import { Input, PasswordInput, Label, FieldError } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="Tu nombre"
          icon={<User className="size-4" />}
          required
        />
        <FieldError messages={state?.errors?.name} />
      </div>

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
        <FieldError messages={state?.errors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          icon={<Lock className="size-4" />}
          required
        />
        <FieldError messages={state?.errors?.password} />
        <p className="mt-1 text-xs text-muted">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <SubmitButton className="w-full" variant="gradient">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
