/**
 * @file time-signature-control.tsx
 * @description Time signature editor for the transport bar.
 *
 * Displays as "4 / 4". Numerator and denominator are independently
 * editable via:
 * - Mouse wheel (hover over the number and scroll)
 * - Click → small popover picker for quick selection
 * - Keyboard arrow keys when focused
 */

"use client";

import type React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  TIME_SIG_DENOMINATORS,
  TIME_SIG_NUMERATORS,
  type TimeSignatureDenominator,
  type TimeSignatureNumerator,
} from "@/types/transport";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TimeSignatureControlProps {
  numerator: TimeSignatureNumerator;
  denominator: TimeSignatureDenominator;
  onNumeratorChange: (n: TimeSignatureNumerator) => void;
  onDenominatorChange: (d: TimeSignatureDenominator) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-component: a single spin-field (cycles through a list of values)
// ---------------------------------------------------------------------------

interface SpinFieldProps<T extends number> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  disabled?: boolean;
  "aria-label": string;
}

function SpinField<T extends number>({
  value,
  options,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: SpinFieldProps<T>): React.ReactElement {
  const currentIndex = options.indexOf(value);

  const cycle = useCallback(
    (direction: 1 | -1) => {
      const next = (currentIndex + direction + options.length) % options.length;
      onChange(options[next]);
    },
    [currentIndex, options, onChange],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      cycle(e.deltaY < 0 ? 1 : -1);
    },
    [disabled, cycle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        cycle(1);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        cycle(-1);
      }
    },
    [cycle],
  );

  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center w-6 h-7",
        "text-sm font-mono font-semibold tabular-nums",
        "text-primary rounded-sm",
        "hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:opacity-40 cursor-ns-resize",
      )}
      aria-label={ariaLabel}
      aria-valuemin={options[0]}
      aria-valuemax={options[options.length - 1]}
      aria-valuenow={value}
      role="spinbutton"
      disabled={disabled}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      title="Scroll or arrow keys to change"
    >
      {value}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * TimeSignatureControl
 *
 * Displays the time signature as two independently-scrollable spin buttons
 * separated by a "/" divider.
 */
export function TimeSignatureControl({
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  disabled = false,
}: TimeSignatureControlProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center select-none">
      {/* Numerator / Denominator */}
      <fieldset className="flex items-center gap-0.5 h-7" aria-label="Time signature">
        <SpinField
          value={numerator}
          options={TIME_SIG_NUMERATORS}
          onChange={onNumeratorChange}
          disabled={disabled}
          aria-label={`Numerator: ${numerator}. Scroll or arrow keys to change.`}
        />
        <span className="text-muted-foreground text-sm font-mono leading-none">/</span>
        <SpinField
          value={denominator}
          options={TIME_SIG_DENOMINATORS}
          onChange={onDenominatorChange}
          disabled={disabled}
          aria-label={`Denominator: ${denominator}. Scroll or arrow keys to change.`}
        />
      </fieldset>
    </div>
  );
}
