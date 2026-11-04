export function SidebarTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-full z-40 ml-3 -translate-y-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-soft transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100">
      {children}
    </span>
  );
}
