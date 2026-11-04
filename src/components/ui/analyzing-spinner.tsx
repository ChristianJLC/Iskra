"use client";

import { motion } from "framer-motion";

export function AnalyzingSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--surface-2)" strokeWidth="4" />
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        style={{ rotate: -90, transformOrigin: "20px 20px" }}
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
