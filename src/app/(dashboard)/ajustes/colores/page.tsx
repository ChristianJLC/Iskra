import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { AccentColorForm } from "@/components/accent-color-form";

export default async function AjustesColoresPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/ajustes" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Ajustes
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Cambiar colores</h1>
      </div>

      <AccentColorForm accentColor={user.accentColor} accentColor2={user.accentColor2} />
    </div>
  );
}
