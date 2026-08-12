import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-danger",
          className
        )}
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </form>
  );
}
