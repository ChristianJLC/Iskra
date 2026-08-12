"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export type DashboardCardData = {
  href: string;
  icon: ReactNode;
  title: string;
  value: string;
  hint: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function DashboardCardsGrid({ cards }: { cards: DashboardCardData[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {cards.map(({ href, icon, title, value, hint }) => (
        <motion.div key={href} variants={item}>
          <Link href={href}>
            <Card
              variant="glass"
              className="flex items-center justify-between transition-colors hover:shadow-glow"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-foreground">{value}</span> {hint}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted" />
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
