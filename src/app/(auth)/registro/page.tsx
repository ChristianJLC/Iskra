import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="reveal">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Crea tu cuenta</h1>
      <p className="mt-2 text-sm text-muted">Empieza a organizar tu día a día.</p>

      <div className="mt-6">
        <SignupForm />
      </div>
    </div>
  );
}
