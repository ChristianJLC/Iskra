"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, Dumbbell, BookOpen, ListChecks, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Resumen", shortLabel: "Resumen", icon: Home },
  { href: "/comidas", label: "Comidas", shortLabel: "Comidas", icon: Utensils },
  { href: "/ejercicio", label: "Ejercicio", shortLabel: "Ejercicio", icon: Dumbbell },
  { href: "/estudio", label: "Estudio", shortLabel: "Estudio", icon: BookOpen },
  { href: "/organizacion", label: "Organización", shortLabel: "Tareas", icon: ListChecks },
  { href: "/finanzas", label: "Finanzas", shortLabel: "Finanzas", icon: Wallet },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around border-t border-border bg-surface px-1 py-2">
      {links.map(({ href, label, shortLabel, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
              active ? "text-accent" : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            <span>{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
