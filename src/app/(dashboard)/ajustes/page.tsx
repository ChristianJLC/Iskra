import Link from "next/link";
import { ChevronRight, KeyRound, Palette, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";

export default function AjustesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ajustes</h1>
        <p className="text-sm text-muted">Personaliza la app a tu gusto</p>
      </div>

      <Card className="divide-y divide-border p-0">
        <Link
          href="/ajustes/perfil"
          className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <User className="size-4 text-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">Configuración de perfil</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>

        <Link
          href="/ajustes/colores"
          className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <Palette className="size-4 text-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">Cambiar colores</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>

        <div className="flex items-center gap-3 px-5 py-4">
          <KeyRound className="size-4 text-muted" />
          <span className="flex-1 text-sm font-medium text-muted">Recuperar contraseña</span>
          <span className="text-xs text-muted">Próximamente</span>
        </div>

        <LogoutButton className="rounded-none px-5 py-4 text-danger hover:bg-surface-hover hover:text-danger" />
      </Card>
    </div>
  );
}
