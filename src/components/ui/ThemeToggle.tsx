"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

const ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const LABELS: Record<Theme, string> = {
  light: "Switch to dark mode",
  dark: "Switch to system mode",
  system: "Switch to light mode",
};

/**
 * Icon button that cycles through Light → Dark → System themes.
 * Renders null until mounted to prevent hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — theme is only known client-side
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;

  const current = (theme as Theme) ?? "system";

  const cycleTheme = () => {
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={LABELS[current]}
      title={LABELS[current]}
      className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
    >
      {ICONS[current]}
    </Button>
  );
}
