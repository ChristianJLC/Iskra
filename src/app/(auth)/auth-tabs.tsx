"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/registro", label: "Crear cuenta" },
];

export function AuthTabs() {
  const pathname = usePathname();

  if (!tabs.some(({ href }) => href === pathname)) return null;

  return (
    <nav aria-label="Acceso" className="mb-6 flex rounded-full bg-surface-2 p-1">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-10 flex-1 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors",
              active ? "text-background" : "text-muted hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="auth-tab-indicator"
                className="absolute inset-0 rounded-full bg-foreground shadow-soft"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
