import { getCurrentUser } from "@/lib/dal";
import { SidebarNav, BottomNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:px-4 md:py-6">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold text-foreground">Rutinas</p>
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
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:justify-end md:px-8">
          <p className="text-lg font-semibold text-foreground md:hidden">Rutinas</p>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>

        <div className="fixed inset-x-0 bottom-0 md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
