import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1 className="reveal text-2xl font-semibold tracking-tight text-foreground [--i:2] sm:text-3xl">
        Bienvenido de nuevo
      </h1>
      <p className="reveal mt-2 text-sm text-muted [--i:3]">Inicia sesión para continuar con tus rutinas.</p>

      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
