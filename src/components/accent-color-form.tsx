"use client";

import { useEffect, useState, useTransition } from "react";
import { saveAccentColors, resetAccentColors } from "@/actions/appearance";
import { DEFAULT_ACCENT, DEFAULT_ACCENT_2, getContrastForeground } from "@/lib/accent-color";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

export function AccentColorForm({
  accentColor,
  accentColor2,
}: {
  accentColor: string | null;
  accentColor2: string | null;
}) {
  const [accent, setAccent] = useState(accentColor ?? DEFAULT_ACCENT);
  const [accent2, setAccent2] = useState(accentColor2 ?? DEFAULT_ACCENT_2);
  const [isSaving, startSaving] = useTransition();
  const [isResetting, startResetting] = useTransition();

  useEffect(() => {
    const shell = document.getElementById("dashboard-shell");
    shell?.style.setProperty("--accent", accent);
    shell?.style.setProperty("--accent-2", accent2);
    shell?.style.setProperty("--accent-foreground", getContrastForeground(accent));
    shell?.style.setProperty(
      "--accent-glow",
      "color-mix(in srgb, var(--accent) var(--accent-glow-ratio), transparent)"
    );
    shell?.style.setProperty("--shadow-glow", "0 0 32px 0 var(--accent-glow)");
  }, [accent, accent2]);

  function handleReset() {
    startResetting(async () => {
      await resetAccentColors();
      setAccent(DEFAULT_ACCENT);
      setAccent2(DEFAULT_ACCENT_2);

      const shell = document.getElementById("dashboard-shell");
      shell?.style.removeProperty("--accent");
      shell?.style.removeProperty("--accent-2");
      shell?.style.removeProperty("--accent-foreground");
      shell?.style.removeProperty("--accent-glow");
      shell?.style.removeProperty("--shadow-glow");
    });
  }

  return (
    <Card className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accent">Color principal</Label>
          <input
            id="accent"
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface p-1"
          />
        </div>
        <div>
          <Label htmlFor="accent2">Color secundario</Label>
          <input
            id="accent2"
            type="color"
            value={accent2}
            onChange={(e) => setAccent2(e.target.value)}
            className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface p-1"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="gradient"
          disabled={isSaving || isResetting}
          onClick={() => startSaving(() => saveAccentColors(accent, accent2))}
        >
          {isSaving ? "Guardando…" : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving || isResetting}
          onClick={handleReset}
        >
          {isResetting ? "Restableciendo…" : "Restablecer"}
        </Button>
      </div>
    </Card>
  );
}
