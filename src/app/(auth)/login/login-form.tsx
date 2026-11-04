"use client";

import { useActionState, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { login } from "@/actions/auth";
import { Input, PasswordInput, Label, FieldError } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { authInputClass } from "../input-styles";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-4">
      <div className="reveal [--i:4]">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          className={authInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FieldError messages={state?.errors?.email} />
      </div>

      <div className="reveal [--i:5]">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          icon={<Lock className="size-4" />}
          className={authInputClass}
          required
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      {state?.message && (
        <p role="alert" className="reveal rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {state.message}
        </p>
      )}

      <div className="reveal [--i:6]">
        <SubmitButton
          className="h-12 w-full"
          variant="solid"
          pendingLabel="Entrando…"
          whileHover={{ y: -2 }}
        >
          Iniciar sesión
        </SubmitButton>
      </div>
    </form>
  );
}
