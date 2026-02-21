/**
 * @file snap-grid-control.tsx
 * @description Snap-to-grid subdivision selector for the transport bar.
 *
 * Renders a compact inline button group (Bar | 1/2 | 1/4 | 1/8 | 1/16 | 1/32).
 * Active option is highlighted with the accent color.
 */

"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { SNAP_GRID_OPTIONS, type SnapGrid } from "@/types/transport";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SnapGridControlProps {
  value: SnapGrid;
  onChange: (grid: SnapGrid) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SnapGridControl
 *
 * A compact inline button group for selecting the timeline snap subdivision.
 */
export function SnapGridControl({ value, onChange, disabled = false }: SnapGridControlProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center select-none">
      <fieldset
        className="flex items-center h-7 rounded-sm overflow-hidden border border-white/10"
        aria-label="Snap to grid subdivision"
      >
        {SNAP_GRID_OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                "h-full px-1.5 text-[10px] font-mono font-medium transition-none",
                "border-r border-white/10 last:border-r-0",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isActive
                  ? "bg-primary/40 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
              )}
              aria-label={`Snap to ${option.label}`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
