import { cn } from "@/lib/cn";

export function IskraMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-10 overflow-visible", className)}>
      <rect width="40" height="40" rx="12" fill="var(--foreground)" />
      <rect x="17" y="17" width="6" height="15" rx="3" fill="var(--background)" />
      {animated && (
        <circle className="logo-ember-ring" cx="20" cy="10.5" r="3.5" fill="none" stroke="var(--ember)" strokeWidth="1" />
      )}
      <circle className={cn(animated && "logo-ember")} cx="20" cy="10.5" r="3.5" fill="var(--ember)" />
    </svg>
  );
}

export function IskraLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <IskraMark animated />
      <span className="text-2xl font-semibold tracking-tight text-foreground">Iskra</span>
    </div>
  );
}
