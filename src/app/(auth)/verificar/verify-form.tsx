"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { verifyAccount } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { authInputClass } from "../input-styles";

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
            className={authInputClass}
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
          className={`${authInputClass} text-center text-lg font-semibold tracking-[0.5em]`}
          required
        />
        <FieldError messages={state?.errors?.code} />
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <SubmitButton className="h-12 w-full" variant="solid" pendingLabel="Verificando…" whileHover={{ y: -2 }}>
        Verificar cuenta
      </SubmitButton>
    </form>
  );
}
