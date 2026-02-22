/**
 * Piano Roll feature — type constants and view helpers.
 *
 * Re-exports MIDI core types from daw.types and provides
 * rendering constants used by PianoKeyboard and NoteGrid.
 */
export type {
    MidiClip,
    NoteEvent,
} from "@/features/daw/types/daw.types";

// ── Rendering constants ───────────────────────────────────────────────────────

/** Pixel height of one pitch row in the note grid. */
export const NOTE_ROW_HEIGHT = 14;

/** Pixel width of one beat in the note grid. */
export const BEAT_WIDTH = 40;

/** Pixel width of the piano keyboard column. */
export const KEYBOARD_WIDTH = 48;

/** Total number of visible pitches (C2=36 to B5=83, 48 semitones). */
export const PITCH_COUNT = 48;

/** Lowest displayed pitch (C2 = MIDI 36). */
export const PITCH_MIN = 36;

/** Highest displayed pitch (B5 = MIDI 83). */
export const PITCH_MAX = 83;

// ── Pitch helpers ─────────────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Convert MIDI pitch number to note name string, e.g. 60 → "C4". */
export function pitchToName(pitch: number): string {
    const octave = Math.floor(pitch / 12) - 1;
    const name = NOTE_NAMES[pitch % 12];
    return `${name}${octave}`;
}

/** Convert note name string back to MIDI pitch, e.g. "C4" → 60. */
export function nameToPitch(name: string): number {
    const match = name.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 60;
    const noteIdx = NOTE_NAMES.indexOf(match[1]);
    const octave = parseInt(match[2], 10);
    return (octave + 1) * 12 + noteIdx;
}

/** Returns true if a MIDI pitch is a black key. */
export function isBlackKey(pitch: number): boolean {
    return [1, 3, 6, 8, 10].includes(pitch % 12);
}

/**
 * Convert pixel Y-coordinate within the note grid to a MIDI pitch.
 * Y=0 is the top (highest pitch = PITCH_MAX).
 */
export function yToPitch(y: number): number {
    const row = Math.floor(y / NOTE_ROW_HEIGHT);
    return PITCH_MAX - row;
}

/**
 * Convert a MIDI pitch to the Y pixel top of its row in the note grid.
 */
export function pitchToY(pitch: number): number {
    return (PITCH_MAX - pitch) * NOTE_ROW_HEIGHT;
}

/**
 * Convert pixel X-coordinate within the note grid to a beat position.
 * Snaps to the nearest beat.
 */
export function xToBeat(x: number): number {
    return Math.max(0, Math.floor(x / BEAT_WIDTH));
}
