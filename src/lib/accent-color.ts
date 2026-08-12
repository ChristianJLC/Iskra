import type { CSSProperties } from "react";

export const DEFAULT_ACCENT = "#2563eb";
export const DEFAULT_ACCENT_2 = "#9333ea";

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function getContrastForeground(hex: string): "#000000" | "#ffffff" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function resolveAccentStyle(
  accentColor: string | null,
  accentColor2: string | null
): CSSProperties | undefined {
  if (!accentColor || !accentColor2) return undefined;

  return {
    "--accent": accentColor,
    "--accent-2": accentColor2,
    "--accent-foreground": getContrastForeground(accentColor),
    "--accent-glow": "color-mix(in srgb, var(--accent) var(--accent-glow-ratio), transparent)",
    "--shadow-glow": "0 0 32px 0 var(--accent-glow)",
  } as CSSProperties;
}
