/**
 * @file transport-store.ts
 * @description Zustand store for the Transport feature.
 *
 * Layer 3 — State Layer. No Tone.js imports directly.
 * All audio mutations are delegated to the engine layer after state updates.
 *
 * State includes:
 * - tempo (BPM)
 * - timeSignature
 * - snapGrid
 * - metronomeEnabled
 * - countInEnabled
 * - playState (runtime, not persisted)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  engineGetPlayState,
  enginePause,
  enginePlay,
  engineSetCountIn,
  engineSetMetronome,
  engineSetTempo,
  engineSetTimeSignature,
  engineStop,
} from "@/features/audio/engine";
import { clampBpm, type SnapGrid, type TimeSignature, type TransportPlayState } from "@/types/transport";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface TransportState {
  /** Current tempo in beats per minute */
  tempo: number;
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Snap-to-grid subdivision */
  snapGrid: SnapGrid;
  /** Whether the metronome click is active */
  metronomeEnabled: boolean;
  /** Whether count-in pre-roll plays before transport starts */
  countInEnabled: boolean;
  /** Runtime play state (not persisted to project) */
  playState: TransportPlayState;

  // ---- Actions ----
  /** Sets the tempo. Clamps to 20–300 BPM. */
  setTempo: (bpm: number) => void;
  /** Sets the time signature. */
  setTimeSignature: (sig: Partial<TimeSignature>) => void;
  /** Sets the snap-to-grid subdivision. */
  setSnapGrid: (grid: SnapGrid) => void;
  /** Toggles metronome on/off. */
  toggleMetronome: () => void;
  /** Toggles count-in pre-roll on/off. */
  toggleCountIn: () => void;
  /** Starts or resumes transport playback. */
  play: () => Promise<void>;
  /** Pauses transport, preserving playhead position. */
  pause: () => void;
  /** Stops transport and returns to start. */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_TEMPO = 120;
const DEFAULT_TIME_SIGNATURE: TimeSignature = { numerator: 4, denominator: 4 };
const DEFAULT_SNAP_GRID: SnapGrid = "1/4";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTransportStore = create<TransportState>()(
  immer((set, get) => ({
    tempo: DEFAULT_TEMPO,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    snapGrid: DEFAULT_SNAP_GRID,
    metronomeEnabled: false,
    countInEnabled: false,
    playState: "stopped",

    setTempo(bpm) {
      const clamped = clampBpm(bpm);
      set((state) => {
        state.tempo = clamped;
      });
      engineSetTempo(clamped);
    },

    setTimeSignature(sig) {
      set((state) => {
        if (sig.numerator !== undefined) {
          state.timeSignature.numerator = sig.numerator;
        }
        if (sig.denominator !== undefined) {
          state.timeSignature.denominator = sig.denominator;
        }
      });
      const { timeSignature } = get();
      engineSetTimeSignature(timeSignature.numerator, timeSignature.denominator);
    },

    setSnapGrid(grid) {
      set((state) => {
        state.snapGrid = grid;
      });
      // Snap grid affects Pixi timeline rendering — no Tone engine call needed
    },

    toggleMetronome() {
      set((state) => {
        state.metronomeEnabled = !state.metronomeEnabled;
      });
      engineSetMetronome(get().metronomeEnabled);
    },

    toggleCountIn() {
      set((state) => {
        state.countInEnabled = !state.countInEnabled;
      });
      engineSetCountIn(get().countInEnabled);
    },

    async play() {
      await enginePlay();
      set((state) => {
        state.playState = engineGetPlayState() === "started" ? "playing" : state.playState;
      });
    },

    pause() {
      enginePause();
      set((state) => {
        state.playState = "paused";
      });
    },

    stop() {
      engineStop();
      set((state) => {
        state.playState = "stopped";
      });
    },
  })),
);

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

/** Returns true when transport is actively playing */
export const selectIsPlaying = (s: TransportState): boolean => s.playState === "playing";

/** Returns true when transport is paused */
export const selectIsPaused = (s: TransportState): boolean => s.playState === "paused";

/** Returns formatted tempo string (e.g. "120.0") */
export const selectTempoDisplay = (s: TransportState): string => s.tempo.toFixed(1);

/** Returns formatted time signature string (e.g. "4/4") */
export const selectTimeSigDisplay = (s: TransportState): string =>
  `${s.timeSignature.numerator}/${s.timeSignature.denominator}`;
