import Link from "next/link";
import { Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { AppSidebar } from "@/components/app-sidebar";
import { IskraMark } from "@/components/iskra-logo";
import { BottomNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimezoneSync } from "@/components/timezone-sync";
import { AnnouncementModal } from "@/components/announcement-modal";
import { resolveAccentStyle } from "@/lib/accent-color";
import { CURRENT_ANNOUNCEMENT_ID } from "@/lib/announcement";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const accentStyle = resolveAccentStyle(user.accentColor, user.accentColor2);

  return (
    <div id="dashboard-shell" className="min-h-screen md:flex" style={accentStyle}>
      <TimezoneSync currentTimezone={user.timezone} />
      <AnnouncementModal
        announcementId={CURRENT_ANNOUNCEMENT_ID}
        alreadySeen={user.lastSeenAnnouncement === CURRENT_ANNOUNCEMENT_ID}
      />
      <AppSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <IskraMark className="size-8" />
            <p className="text-lg font-bold tracking-tight text-foreground">Iskra</p>
          </div>
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
