import { VerifyForm } from "./verify-form";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Verifica tu cuenta</h1>
      <p className="mt-1 text-sm text-muted">
        {email ? (
          <>
            Te enviamos una solicitud de verificación. Ingresa el código de 6 dígitos que te pasó el
            administrador para <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          "Ingresa tu correo y el código de 6 dígitos que te pasó el administrador."
        )}
      </p>

      <div className="mt-6">
        <VerifyForm email={email} />
      </div>
    </div>
  );
}
