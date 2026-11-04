"use client";

import { MotionConfig } from "framer-motion";
import { X } from "lucide-react";

export function Sheet({
  title,
  description,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <dialog
      ref={(el) => {
        if (el && !el.open) {
          el.showModal();
          el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
        }
      }}
      aria-label={title}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="sheet-in m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-surface-1 text-foreground shadow-soft backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex sm:m-auto sm:max-w-2xl sm:rounded-3xl"
    >
      <MotionConfig reducedMotion="user">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </MotionConfig>
    </dialog>
  );
}
