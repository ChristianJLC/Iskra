import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { IskraMark } from "@/components/iskra-logo";
import { SidebarNav, SidebarSettingsLink } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";

export function AppSidebar() {
  return (
    <aside className="hidden md:sticky md:top-3 md:z-30 md:m-3 md:mr-0 md:flex md:h-[calc(100dvh-1.5rem)] md:w-[4.5rem] md:shrink-0 md:flex-col md:items-center md:self-start md:rounded-3xl md:border md:border-border/60 md:bg-surface-1 md:py-4 md:shadow-soft">
      <Link
        href="/"
        aria-label="Iskra, ir al resumen"
        className="rounded-xl outline-offset-2 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-accent motion-safe:hover:scale-105"
      >
        <IskraMark />
      </Link>

      <div className="mt-6 flex-1">
        <SidebarNav />
      </div>

      <div className="flex flex-col items-center gap-1.5 border-t border-border/70 pt-3">
        <div className="group relative">
          <ThemeToggle className="size-11 bg-transparent hover:bg-surface-hover hover:shadow-none" />
          <SidebarTooltip>Cambiar tema</SidebarTooltip>
        </div>
        <SidebarSettingsLink />
        <form action={logout}>
          <button
            type="submit"
            className="group relative flex size-11 items-center justify-center rounded-full text-muted outline-offset-2 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut className="size-5" />
            <SidebarTooltip>Cerrar sesión</SidebarTooltip>
          </button>
        </form>
      </div>
    </aside>
  );
}
