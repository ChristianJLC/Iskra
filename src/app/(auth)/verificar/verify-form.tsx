"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { verifyAccount } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function VerifyForm({ email }: { email?: string }) {
  const [state, action] = useActionState(verifyAccount, undefined);

  return (
    <form action={action} className="space-y-4">
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
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
      )}

      <div>
        <Label htmlFor="code">Código de verificación</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="text-center text-lg font-semibold tracking-[0.5em]"
          required
        />
        <FieldError messages={state?.errors?.code} />
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <SubmitButton className="w-full" variant="gradient">
        Verificar cuenta
      </SubmitButton>
    </form>
  );
}
