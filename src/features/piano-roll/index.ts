// Public API for the `piano-roll` feature slice.
// Other features/pages should import from here, not from internal paths.

export { PianoRoll } from "./components/PianoRoll";
export { usePianoRoll } from "./hooks/usePianoRoll";
export type { UsePianoRollReturn } from "./hooks/usePianoRoll";
export {
    BEAT_WIDTH,
    KEYBOARD_WIDTH,
    NOTE_ROW_HEIGHT,
    PITCH_MAX,
    PITCH_MIN,
    PITCH_COUNT,
    isBlackKey,
    pitchToName,
    nameToPitch,
    pitchToY,
    yToPitch,
    xToBeat,
} from "./types/piano-roll.types";
export type { MidiClip, NoteEvent } from "./types/piano-roll.types";
