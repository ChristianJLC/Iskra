"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Utensils, Dumbbell, BookOpen, ListChecks, Wallet } from "lucide-react";
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
              "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-accent-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-active-sidebar"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-glow"
                transition={springTransition}
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around px-1 py-2">
      {links.map(({ href, label, shortLabel, icon: Icon }) => {
        const active = pathname === href;
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
