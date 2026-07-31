import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Bienvenido de nuevo</h1>
      <p className="mt-1 text-sm text-muted">Inicia sesión para continuar con tus rutinas.</p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
