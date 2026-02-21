/**
 * @file engine.ts
 * @description Tone.js Audio Engine singleton.
 *
 * Layer 2 — Audio Engine. No React imports. No Zustand imports.
 * All Tone.js logic lives here.
 *
 * Responsibilities:
 * - Single Tone.Transport instance
 * - Metronome synth + beat sequence
 * - Count-in pre-roll scheduling
 * - Tempo and time-signature sync
 *
 * Usage (from store layer only):
 *   engineSetTempo(120);
 *   await enginePlay();
 *   enginePause();
 *   engineStop();
 */

import type { SnapGrid } from "@/types/transport";

// ---------------------------------------------------------------------------
// Browser guard — all functions are no-ops when running server-side (SSR)
// ---------------------------------------------------------------------------

const IS_BROWSER = typeof window !== "undefined";

// ---------------------------------------------------------------------------
// Module-level singletons (lazy-initialised on first enginePlay call)
// ---------------------------------------------------------------------------

// biome-ignore lint/suspicious/noExplicitAny: Tone types loaded dynamically to avoid SSR breakage
type ToneLib = any;

let Tone: ToneLib = null;
// biome-ignore lint/suspicious/noExplicitAny: Tone instance type
let accentSynth: any = null;
// biome-ignore lint/suspicious/noExplicitAny: Tone instance type
let beatSynth: any = null;
// biome-ignore lint/suspicious/noExplicitAny: Tone instance type
let beatSequence: any = null;
let initialized = false;

/** Current metronome enable flag (read inside Tone-scheduled callbacks) */
let metronomeEnabled = false;
/** Current numerator — needed for beat sequence pattern length */
let currentNumerator = 4;
/** Current BPM — needed for count-in pre-roll timing */
let currentBpm = 120;
/** Whether count-in is active */
let countInEnabled = false;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Lazily imports Tone.js and creates metronome synths.
 * Must be called after a user gesture to satisfy browser AudioContext policy.
 * @returns true if initialisation succeeded
 */
async function ensureInit(): Promise<boolean> {
  if (!IS_BROWSER) return false;
  if (initialized) return true;

  Tone = await import("tone");
  await Tone.start(); // Resumes AudioContext after user gesture

  accentSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    volume: -4,
  }).toDestination();

  beatSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
    volume: -10,
  }).toDestination();

  initialized = true;
  return true;
}

// ---------------------------------------------------------------------------
// Beat sequence helpers
// ---------------------------------------------------------------------------

/**
 * Tears down and rebuilds the Tone.Sequence that drives the metronome.
 * Must be called whenever the time signature numerator changes.
 * @param numerator - Number of beats per measure
 */
function rebuildBeatSequence(numerator: number): void {
  if (!Tone) return;

  if (beatSequence) {
    beatSequence.stop();
    beatSequence.dispose();
    beatSequence = null;
  }

  // Index 0 = accent (downbeat). All others = regular click.
  const events = Array.from({ length: numerator }, (_, i) => (i === 0 ? "accent" : "beat"));

  beatSequence = new Tone.Sequence(
    (time: number, type: "accent" | "beat") => {
      if (!metronomeEnabled) return;
      if (type === "accent") {
        accentSynth?.triggerAttackRelease("C5", "64n", time);
      } else {
        beatSynth?.triggerAttackRelease("C4", "64n", time);
      }
    },
    events,
    "4n",
  );

  // Anchor the sequence to the start of the transport timeline
  beatSequence.start(0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Updates the transport tempo. Safe to call during playback.
 * @param bpm - Beats per minute (20–300)
 */
export function engineSetTempo(bpm: number): void {
  if (!IS_BROWSER) return;
  currentBpm = bpm;
  if (!initialized || !Tone) return;
  Tone.Transport.bpm.value = bpm;
}

/**
 * Sets the transport time signature and rebuilds the metronome beat sequence.
 * @param numerator - Beats per measure
 * @param denominator - Beat value (2, 4, 8, or 16)
 */
export function engineSetTimeSignature(numerator: number, denominator: number): void {
  if (!IS_BROWSER) return;
  currentNumerator = numerator;
  if (!initialized || !Tone) return;
  Tone.Transport.timeSignature = [numerator, denominator];
  rebuildBeatSequence(numerator);
}

/**
 * Enables or disables the metronome click track without stopping the transport.
 * @param enabled - Whether clicks should sound during playback
 */
export function engineSetMetronome(enabled: boolean): void {
  metronomeEnabled = enabled;
}

/**
 * Enables or disables count-in pre-roll before playback.
 * @param enabled - Whether a count-in should play before the transport starts
 */
export function engineSetCountIn(enabled: boolean): void {
  countInEnabled = enabled;
}

/**
 * Starts transport playback. Initialises the AudioContext on first call.
 *
 * If count-in is enabled, schedules `numerator` metronome clicks using
 * Tone.js scheduling (no setTimeout) then starts the transport at the
 * correct offset.
 */
export async function enginePlay(): Promise<void> {
  if (!IS_BROWSER) return;

  const ready = await ensureInit();
  if (!ready || !Tone) return;

  if (!beatSequence) {
    rebuildBeatSequence(currentNumerator);
  }

  if (countInEnabled) {
    const beatDuration = 60 / currentBpm; // seconds per beat
    const lookahead = 0.05; // small scheduling buffer
    const now = Tone.now() + lookahead;

    // Schedule count-in clicks using Tone timing — never setTimeout
    for (let i = 0; i < currentNumerator; i++) {
      const clickTime = now + i * beatDuration;
      if (i === 0) {
        accentSynth?.triggerAttackRelease("C5", "32n", clickTime);
      } else {
        beatSynth?.triggerAttackRelease("C4", "32n", clickTime);
      }
    }

    Tone.Transport.start(now + currentNumerator * beatDuration);
  } else {
    Tone.Transport.start();
  }
}

/**
 * Pauses the transport at the current playhead position.
 */
export function enginePause(): void {
  if (!IS_BROWSER || !initialized || !Tone) return;
  Tone.Transport.pause();
}

/**
 * Stops the transport and resets playhead to the beginning.
 */
export function engineStop(): void {
  if (!IS_BROWSER || !initialized || !Tone) return;
  Tone.Transport.stop();
}

/**
 * Returns the current transport play state.
 */
export function engineGetPlayState(): "started" | "paused" | "stopped" {
  if (!IS_BROWSER || !initialized || !Tone) return "stopped";
  return Tone.Transport.state as "started" | "paused" | "stopped";
}

/**
 * Converts a SnapGrid enum value to its Tone.js time notation string.
 * @param grid - SnapGrid identifier
 * @returns Tone.js time notation (e.g. `"4n"` for `"1/4"`)
 */
export function snapGridToToneTime(grid: SnapGrid): string {
  const map: Record<SnapGrid, string> = {
    bar: "1m",
    "1/2": "2n",
    "1/4": "4n",
    "1/8": "8n",
    "1/16": "16n",
    "1/32": "32n",
  };
  return map[grid];
}

/**
 * Disposes all Tone.js nodes and stops the transport. Call on workspace unmount.
 */
export function engineDispose(): void {
  if (!IS_BROWSER || !Tone) return;
  beatSequence?.stop();
  beatSequence?.dispose();
  accentSynth?.dispose();
  beatSynth?.dispose();
  Tone.Transport.stop();
  Tone.Transport.cancel();
  beatSequence = null;
  accentSynth = null;
  beatSynth = null;
  initialized = false;
}
