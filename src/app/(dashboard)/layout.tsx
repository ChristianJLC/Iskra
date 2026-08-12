import Link from "next/link";
import { Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { SidebarNav, BottomNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { resolveAccentStyle } from "@/lib/accent-color";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const accentStyle = resolveAccentStyle(user.accentColor, user.accentColor2);

  return (
    <div id="dashboard-shell" className="min-h-screen md:flex" style={accentStyle}>
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface-1 md:px-4 md:py-6">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold tracking-tight text-foreground">Iskra</p>
          <p className="truncate text-xs text-muted">{user.name}</p>
        </div>

        <div className="flex-1">
          <SidebarNav />
        </div>

        <div className="space-y-1 border-t border-border pt-3">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:justify-end md:px-8">
          <p className="text-lg font-bold tracking-tight text-foreground md:hidden">Iskra</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/ajustes"
              aria-label="Configuración"
              className="flex size-9 items-center justify-center rounded-full bg-surface-1 text-muted transition-colors hover:text-foreground hover:shadow-glow"
            >
              <Settings className="size-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-3 mb-3 md:hidden">
          <div className="glass rounded-3xl">
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  );
}
