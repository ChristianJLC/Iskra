import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-danger"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </form>
  );
}
