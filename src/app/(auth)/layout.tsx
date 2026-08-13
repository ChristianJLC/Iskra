import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-accent opacity-30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-accent-2 opacity-30 blur-[100px]" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center">
          <p className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Iskra
          </p>
        </div>

        <Card variant="glass" className="shadow-glow shadow-soft p-8">
          {children}
        </Card>
      </div>
    </div>
  );
}
