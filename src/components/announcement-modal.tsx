"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { markAnnouncementSeen } from "@/actions/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_TITLE, ANNOUNCEMENT_ITEMS } from "@/lib/announcement";

export function AnnouncementModal({
  announcementId,
  alreadySeen,
}: {
  announcementId: string;
  alreadySeen: boolean;
}) {
  const [open, setOpen] = useState(!alreadySeen);
  const [isPending, startTransition] = useTransition();

  function dismiss() {
    setOpen(false);
    startTransition(() => {
      markAnnouncementSeen(announcementId);
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="w-full max-w-sm"
          >
            <Card variant="glass" className="space-y-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow">
                <Sparkles className="size-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">{ANNOUNCEMENT_TITLE}</h2>
              </div>

              <ul className="space-y-2">
                {ANNOUNCEMENT_ITEMS.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted">
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button type="button" variant="secondary" disabled={isPending} onClick={dismiss} className="w-full">
                Entendido
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
