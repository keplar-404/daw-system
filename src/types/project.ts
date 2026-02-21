/**
 * @file project.ts
 * @description Core TypeScript type definitions for Project & Session Management.
 * Represents the full hierarchical project JSON structure.
 */

// ---------------------------------------------------------------------------
// Primitive / shared types
// ---------------------------------------------------------------------------

/** Supported musical key signatures */
export type KeySignature =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "D#"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "G#"
  | "Ab"
  | "A"
  | "A#"
  | "Bb"
  | "B";

/** Scale mode paired with key */
export type ScaleMode = "major" | "minor" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "locrian";

/** Supported time signatures numerator values */
export type TimeSignatureNumerator = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

/** Supported time signatures denominator values */
export type TimeSignatureDenominator = 2 | 4 | 8 | 16;

/** Time signature object */
export interface TimeSignature {
  readonly numerator: TimeSignatureNumerator;
  readonly denominator: TimeSignatureDenominator;
}

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------

/** A single automation point in time */
export interface AutomationPoint {
  readonly id: string;
  /** Time in seconds from project start */
  readonly time: number;
  /** Normalized value 0–1 */
  readonly value: number;
  /** Interpolation curve type */
  readonly curve: "linear" | "step" | "exponential";
}

/** An automation lane targeting a specific parameter */
export interface AutomationLane {
  readonly id: string;
  readonly trackId: string;
  /** Parameter path e.g. "volume", "pan", "effects.0.wet" */
  readonly parameter: string;
  readonly label: string;
  readonly points: AutomationPoint[];
  readonly enabled: boolean;
}

// ---------------------------------------------------------------------------
// Clips
// ---------------------------------------------------------------------------

/** Type of audio/MIDI content in a clip */
export type ClipType = "audio" | "midi" | "automation";

/** MIDI note inside a MIDI clip */
export interface MidiNote {
  readonly id: string;
  /** MIDI pitch 0–127 */
  readonly pitch: number;
  /** Velocity 0–127 */
  readonly velocity: number;
  /** Start time in bars (relative to clip start) */
  readonly startBar: number;
  /** Duration in bars */
  readonly durationBars: number;
}

/** Represents a single clip on the timeline */
export interface Clip {
  readonly id: string;
  readonly trackId: string;
  readonly type: ClipType;
  readonly name: string;
  /** Start position in bars */
  readonly startBar: number;
  /** Duration in bars */
  readonly durationBars: number;
  /** Audio file reference (for audio clips) */
  readonly audioFileRef?: string;
  /** MIDI notes (for MIDI clips) */
  readonly midiNotes?: MidiNote[];
  /** Clip color override (hex string) */
  readonly color?: string;
  readonly muted: boolean;
  readonly looped: boolean;
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------

/** Type of track */
export type TrackType = "audio" | "midi" | "bus" | "master";

/** Effect plugin settings */
export interface EffectSettings {
  readonly id: string;
  readonly pluginId: string;
  readonly name: string;
  readonly enabled: boolean;
  /** Serializable parameter map */
  readonly params: Record<string, number | string | boolean>;
}

/** A single track in the project */
export interface Track {
  readonly id: string;
  readonly name: string;
  readonly type: TrackType;
  readonly color: string;
  /** Volume 0–1 */
  readonly volume: number;
  /** Pan -1 to +1 */
  readonly pan: number;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly armed: boolean;
  readonly clips: Clip[];
  readonly automationLanes: AutomationLane[];
  readonly effects: EffectSettings[];
  /** For routing: send target track IDs */
  readonly sends: string[];
  readonly order: number;
}

// ---------------------------------------------------------------------------
// Project settings
// ---------------------------------------------------------------------------

/** Global project-level settings */
export interface ProjectSettings {
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  readonly key: KeySignature;
  readonly scale: ScaleMode;
  /** Total project length in bars */
  readonly lengthBars: number;
  /** Sample rate in Hz */
  readonly sampleRate: 44100 | 48000 | 88200 | 96000;
  /** Bit depth */
  readonly bitDepth: 16 | 24 | 32;
}

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

/** Project schema version for migration support */
export const PROJECT_SCHEMA_VERSION = "1.0.0" as const;

/** Full serializable project document */
export interface Project {
  /** Unique project identifier */
  readonly id: string;
  readonly name: string;
  readonly schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  readonly settings: ProjectSettings;
  readonly tracks: Track[];
  /** ISO 8601 timestamp */
  readonly createdAt: string;
  /** ISO 8601 timestamp */
  readonly updatedAt: string;
  /** Last playhead position in bars (for session restore) */
  readonly lastPlayheadBar: number;
}

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

/** Represents a single undoable action */
export interface UndoEntry {
  readonly id: string;
  readonly description: string;
  readonly timestamp: number;
  /** Snapshot of the project state before this action */
  readonly snapshot: Project;
}

/** Undo/Redo stack container */
export interface UndoStack {
  readonly past: UndoEntry[];
  readonly future: UndoEntry[];
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

/** IndexedDB / localStorage session record */
export interface SessionRecord {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly updatedAt: string;
  readonly autoSave: boolean;
}

/** Result of a project import/export operation */
export interface ProjectTransferResult {
  readonly success: boolean;
  readonly projectId?: string;
  readonly error?: string;
}
