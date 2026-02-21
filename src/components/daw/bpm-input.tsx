/**
 * @file bpm-input.tsx
 * @description BPM (tempo) display and editor for the transport bar.
 *
 * Interactions:
 * - Click the number → enter inline edit mode (type a value, press Enter/Escape)
 * - Mouse-wheel hover → ±1 BPM per tick (Shift = ±10)
 * - Click-and-drag vertically → drag up to increase, down to decrease
 * - Arrow keys when focused → ±1 BPM (Shift = ±10)
 */

"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { clampBpm } from "@/types/transport";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BpmInputProps {
  /** Current BPM value */
  value: number;
  /** Called when the user commits a new BPM */
  onChange: (bpm: number) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * BpmInput
 *
 * A compact, drag-and-scroll BPM editor widget suited to the DAW transport bar.
 */
export function BpmInput({ value, onChange, disabled = false }: BpmInputProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartBpm = useRef(value);

  // Keep draft in sync when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value.toFixed(1));
  }, [value, editing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commitDraft = useCallback(() => {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed)) {
      onChange(clampBpm(Math.round(parsed)));
    }
    setEditing(false);
  }, [draft, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitDraft();
      if (e.key === "Escape") {
        setDraft(value.toFixed(1));
        setEditing(false);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onChange(clampBpm(value + (e.shiftKey ? 10 : 1)));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onChange(clampBpm(value - (e.shiftKey ? 10 : 1)));
      }
    },
    [commitDraft, value, onChange],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      onChange(clampBpm(value + delta * (e.shiftKey ? 10 : 1)));
    },
    [disabled, value, onChange],
  );

  // Drag interaction: mouse-down → drag up/down to change BPM
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || editing) return;
      e.preventDefault();
      isDragging.current = false;
      dragStartY.current = e.clientY;
      dragStartBpm.current = value;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        isDragging.current = true;
        const delta = Math.round((dragStartY.current - moveEvent.clientY) / 2);
        onChange(clampBpm(dragStartBpm.current + delta));
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
    },
    [disabled, editing, value, onChange],
  );

  const handleClick = useCallback(() => {
    if (disabled || isDragging.current) return;
    setDraft(value.toFixed(1));
    setEditing(true);
  }, [disabled, value]);

  return (
    <div className="flex flex-col items-center select-none" onWheel={handleWheel}>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-16 h-7 text-center text-sm font-mono font-semibold",
            "bg-accent/70 border border-primary/60 rounded-sm",
            "text-foreground focus:outline-none",
          )}
          aria-label="Tempo in BPM"
        />
      ) : (
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-16 h-7 text-center text-sm font-mono font-semibold rounded-sm",
            "text-primary tabular-nums cursor-ns-resize",
            "hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
          aria-label={`Tempo: ${value} BPM. Click to edit, drag or scroll to adjust.`}
          title="Drag ↕ or scroll to adjust. Click to type."
        >
          {value.toFixed(1)}
        </button>
      )}
    </div>
  );
}
