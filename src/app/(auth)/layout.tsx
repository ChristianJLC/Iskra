import { Card } from "@/components/ui/card";
import { IskraLogo } from "@/components/iskra-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthMotion } from "./auth-motion";
import { AuthTabs } from "./auth-tabs";

const embers = [
  { left: "6%", drift: "24px", duration: "11s", delay: "0s" },
  { left: "17%", drift: "-18px", duration: "14s", delay: "4s" },
  { left: "29%", drift: "30px", duration: "12s", delay: "8s" },
  { left: "44%", drift: "-26px", duration: "15s", delay: "2s" },
  { left: "58%", drift: "20px", duration: "13s", delay: "6s" },
  { left: "71%", drift: "-30px", duration: "11s", delay: "9s" },
  { left: "83%", drift: "26px", duration: "14s", delay: "1s" },
  { left: "94%", drift: "-16px", duration: "12s", delay: "5s" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthMotion>
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="auth-hearth absolute inset-x-0 bottom-0 h-1/2" />
          {embers.map(({ left, drift, duration, delay }) => (
            <span
              key={left}
              className="ember absolute bottom-0 size-1 rounded-full bg-accent"
              style={{ left, "--drift": drift, "--duration": duration, "--delay": delay } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="absolute top-4 right-4 rounded-full shadow-soft">
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="reveal mb-8 flex justify-center">
            <IskraLogo />
          </div>

          <Card className="reveal rounded-3xl p-6 [--i:1] sm:p-8">
            <AuthTabs />
            {children}
          </Card>
        </div>
      </div>
    </AuthMotion>
  );
}
