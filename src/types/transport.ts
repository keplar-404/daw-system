/**
 * @file transport.ts
 * @description TypeScript types for the Transport feature.
 * Covers tempo, time signature, snap-to-grid, metronome, count-in, and play state.
 */

import type { TimeSignature, TimeSignatureDenominator, TimeSignatureNumerator } from "@/types/project";

// Re-export for convenience — consumers can import everything from one place.
export type { TimeSignature, TimeSignatureDenominator, TimeSignatureNumerator };

// ---------------------------------------------------------------------------
// Snap-to-grid
// ---------------------------------------------------------------------------

/** Snap grid subdivision options matching Tone.js time notation */
export type SnapGrid = "bar" | "1/2" | "1/4" | "1/8" | "1/16" | "1/32";

/** Display label + Tone.js time string for each snap grid option */
export interface SnapGridOption {
  readonly value: SnapGrid;
  readonly label: string;
  /** Tone.js time notation (e.g. "4n" for quarter note) */
  readonly toneTime: string;
  /** PPQ ticks per subdivision at 96 PPQ */
  readonly ticksAt96: number;
}

/** All valid snap grid options in order from coarsest to finest */
export const SNAP_GRID_OPTIONS: readonly SnapGridOption[] = [
  { value: "bar", label: "Bar", toneTime: "1m", ticksAt96: 384 },
  { value: "1/2", label: "1/2", toneTime: "2n", ticksAt96: 192 },
  { value: "1/4", label: "1/4", toneTime: "4n", ticksAt96: 96 },
  { value: "1/8", label: "1/8", toneTime: "8n", ticksAt96: 48 },
  { value: "1/16", label: "1/16", toneTime: "16n", ticksAt96: 24 },
  { value: "1/32", label: "1/32", toneTime: "32n", ticksAt96: 12 },
] as const;

// ---------------------------------------------------------------------------
// Play state
// ---------------------------------------------------------------------------

/** Runtime playback state of the transport */
export type TransportPlayState = "stopped" | "playing" | "paused";

// ---------------------------------------------------------------------------
// Time signature helpers
// ---------------------------------------------------------------------------

/** Valid numerator values for time signatures */
export const TIME_SIG_NUMERATORS: readonly TimeSignatureNumerator[] = [2, 3, 4, 5, 6, 7, 8, 9, 12];

/** Valid denominator values for time signatures */
export const TIME_SIG_DENOMINATORS: readonly TimeSignatureDenominator[] = [2, 4, 8, 16];

// ---------------------------------------------------------------------------
// BPM bounds
// ---------------------------------------------------------------------------

export const MIN_BPM = 20;
export const MAX_BPM = 300;

/** Clamps a BPM value to the valid range */
export function clampBpm(value: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(value)));
}
