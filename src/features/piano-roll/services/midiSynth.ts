/**
 * MIDI Synth Service — Piano Roll feature.
 *
 * Manages per-track Tone.PolySynth and Tone.Part nodes.
 * When notes change, the old Part is disposed and a new one
 * is scheduled from the updated note array.
 *
 * Signal chain:
 *   PolySynth → track's Tone.Channel → Destination
 *
 * IMPORTANT: Must only be imported in browser context (hooks/services).
 * Never import in RSC or test files without mocking.
 */

import { getChannel } from "@/features/tracks/services/audioGraph";
import type { NoteEvent } from "@/features/daw/types/daw.types";
import { pitchToName } from "../types/piano-roll.types";

// ── Registry ──────────────────────────────────────────────────────────────────

type SynthEntry = {
    synth: import("tone").PolySynth;
    part: import("tone").Part | null;
};

let registry: Map<string, SynthEntry> | null = null;

function getRegistry(): Map<string, SynthEntry> {
    if (!registry) registry = new Map();
    return registry;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert beats to Tone.js time notation at a given BPM.
 * Returns a string like "0:1:0" (Bars:Beats:Sixteenths).
 */
function beatsToToneTime(beats: number, bpm: number): string {
    // beats → seconds → Tone time string
    // Tone.js accepts raw beat numbers when transport is running
    // We pass as "Xn" relative to the transport position
    const bars = Math.floor(beats / 4);
    const remainingBeats = beats % 4;
    return `${bars}:${remainingBeats}:0`;
}

/**
 * Convert durationBeats to a Tone.js duration string.
 * e.g. 1 beat → "4n", 0.5 beats → "8n"
 */
function durationToTone(durationBeats: number): string {
    // beats × (4 sixteenths per beat) = sixteenths
    const sixteenths = Math.round(durationBeats * 4);
    return `${16 / sixteenths}n`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a PolySynth for an instrument track and connect to its channel.
 * Idempotent — calling twice for the same track is safe.
 */
export async function createSynth(trackId: string): Promise<void> {
    const reg = getRegistry();
    if (reg.has(trackId)) return;

    const Tone = await import("tone");
    const channel = getChannel(trackId);
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
    });

    if (channel) {
        synth.connect(channel);
    } else {
        synth.toDestination();
    }

    reg.set(trackId, { synth, part: null });
}

/**
 * Schedule a Tone.Part for the given note events.
 * Any existing Part for this track is disposed first.
 */
export async function schedulePart(
    trackId: string,
    notes: NoteEvent[],
    bpm: number,
): Promise<void> {
    const Tone = await import("tone");
    const reg = getRegistry();
    const entry = reg.get(trackId);
    if (!entry) return;

    // Dispose old Part
    if (entry.part) {
        entry.part.stop();
        entry.part.dispose();
        entry.part = null;
    }

    if (notes.length === 0) return;

    // Build Tone.Part events
    const events = notes.map((note) => ({
        time: beatsToToneTime(note.startBeat, bpm),
        note: pitchToName(note.pitch),
        duration: durationToTone(note.durationBeats),
        velocity: note.velocity / 127,
    }));

    const part = new Tone.Part(
        (time, ev: { note: string; duration: string; velocity: number }) => {
            entry.synth.triggerAttackRelease(ev.note, ev.duration, time, ev.velocity);
        },
        events,
    );

    part.loop = false;
    part.start(0);

    entry.part = part;
    reg.set(trackId, entry);
}

/**
 * Convenience wrapper — disposes old Part and schedules a new one.
 * Called whenever note data changes.
 */
export async function reschedule(
    trackId: string,
    notes: NoteEvent[],
    bpm: number,
): Promise<void> {
    await schedulePart(trackId, notes, bpm);
}

/**
 * Dispose PolySynth and Part for a track (called when track is deleted).
 */
export function disposeSynth(trackId: string): void {
    const reg = getRegistry();
    const entry = reg.get(trackId);
    if (!entry) return;

    entry.part?.stop();
    entry.part?.dispose();
    entry.synth.dispose();
    reg.delete(trackId);
}

/**
 * Retrieve the PolySynth for a track — primarily for testing.
 */
export function getSynth(
    trackId: string,
): import("tone").PolySynth | undefined {
    return getRegistry().get(trackId)?.synth;
}
