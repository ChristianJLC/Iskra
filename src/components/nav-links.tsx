"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { Home, Utensils, Dumbbell, BookOpen, ListChecks, Wallet, Settings, type LucideIcon } from "lucide-react";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Resumen", shortLabel: "Resumen", icon: Home },
  { href: "/comidas", label: "Nutrición", shortLabel: "Nutrición", icon: Utensils },
  { href: "/ejercicio", label: "Ejercicio", shortLabel: "Ejercicio", icon: Dumbbell },
  { href: "/estudio", label: "Estudio", shortLabel: "Estudio", icon: BookOpen },
  { href: "/organizacion", label: "Organización", shortLabel: "Tareas", icon: ListChecks },
  { href: "/finanzas", label: "Finanzas", shortLabel: "Finanzas", icon: Wallet },
];

const springTransition = { type: "spring" as const, stiffness: 400, damping: 32 };

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex size-11 items-center justify-center rounded-full outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
        active ? "text-background" : "text-muted hover:bg-surface-hover hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active-sidebar"
          className="absolute inset-0 rounded-full bg-foreground shadow-soft"
          transition={springTransition}
        />
      )}
      <Icon className="relative size-5" />
      <SidebarTooltip>{label}</SidebarTooltip>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Principal" className="flex flex-col items-center gap-1.5">
        {links.map(({ href, label, icon }) => (
          <SidebarLink key={href} href={href} label={label} icon={icon} />
        ))}
      </nav>
    </MotionConfig>
  );
}

export function SidebarSettingsLink() {
  return (
    <MotionConfig reducedMotion="user">
      <SidebarLink href="/ajustes" label="Configuración" icon={Settings} />
    </MotionConfig>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around px-1 py-2">
      {links.map(({ href, label, shortLabel, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium"
          >
            {active && (
              <motion.div
                layoutId="nav-active-bottom"
                className="absolute inset-0 rounded-xl bg-accent/15"
                transition={springTransition}
              />
            )}
            <Icon
              className={cn(
                "relative size-5 transition-colors",
                active ? "text-accent" : "text-muted"
              )}
            />
            <span className={cn("relative transition-colors", active ? "text-accent" : "text-muted")}>
              {shortLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
