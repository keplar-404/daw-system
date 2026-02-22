// ── Plugin System ─────────────────────────────────────────────────────────────

export type PluginType = "reverb" | "delay" | "eq";

export interface ReverbParams {
  type: "reverb";
  /** Room decay time in seconds. Range: 0.1–10. Default: 1.5 */
  decay: number;
  /** Wet/dry mix. Range: 0–1. Default: 0.5 */
  mix: number;
}

export interface DelayParams {
  type: "delay";
  /** Delay time in seconds. Range: 0–1. Default: 0.25 */
  delayTime: number;
  /** Feedback ratio. Range: 0–0.95. Default: 0.3 */
  feedback: number;
  /** Wet/dry mix. Range: 0–1. Default: 0.5 */
  mix: number;
}

export interface EQParams {
  type: "eq";
  /** Low-shelf gain in dB. Range: −15 to +15. Default: 0 */
  low: number;
  /** Mid-peak gain in dB. Range: −15 to +15. Default: 0 */
  mid: number;
  /** High-shelf gain in dB. Range: −15 to +15. Default: 0 */
  high: number;
}

export type PluginParams = ReverbParams | DelayParams | EQParams;

export interface PluginInstance {
  id: string;
  type: PluginType;
  params: PluginParams;
}

// ── Core DAW Types ────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  name: string;
  muted: boolean;
  solo: boolean;
  /** Volume in decibels. Range: −60 to +6. Default: 0 */
  volume: number;
  /** Stereo pan. Range: −1 (full left) to +1 (full right). Default: 0 */
  pan: number;
  /** Ordered list of audio effects on this track. Default: [] */
  plugins?: PluginInstance[];
  /** Whether this is an audio or MIDI instrument track. Default: "audio" */
  trackKind?: "audio" | "instrument";
}

export interface Clip {
  id: string;
  trackId: string;
  startBeat: number;
  durationBeats: number;
  audioUrl?: string;
  name?: string;
}

// ── MIDI Types ─────────────────────────────────────────────────────────────

export interface NoteEvent {
  id: string;
  /** MIDI pitch number 0–127. Middle C (C4) = 60. */
  pitch: number;
  /** Beat position where the note starts. */
  startBeat: number;
  /** Duration in beats. */
  durationBeats: number;
  /** Velocity 0–127. Default: 100 */
  velocity: number;
}

export interface MidiClip {
  id: string;
  trackId: string;
  /** Beat where this clip starts on the timeline. */
  startBeat: number;
  /** Total duration of the clip in beats. */
  durationBeats: number;
  /** All MIDI note events inside this clip. */
  notes: NoteEvent[];
}

// ── Automation Types ──────────────────────────────────────────────────────────

export type AutomationTarget = "volume" | "pan";

export interface AutomationNode {
  id: string;
  /** Beat position of this automation point. */
  beat: number;
  /**
   * Parameter value.
   * volume: dB, range −60 to +6.
   * pan: ratio, range −1 (full left) to +1 (full right).
   */
  value: number;
}

export interface AutomationLane {
  /** Track this lane belongs to. */
  trackId: string;
  /** Which parameter this lane automates. */
  target: AutomationTarget;
  /** Automation nodes sorted ascending by beat. */
  nodes: AutomationNode[];
}

export interface DawState {
  /** Beats per minute. Min: 20, Max: 300. Default: 120 */
  bpm: number;
  isPlaying: boolean;
  isLooping: boolean;
  /** Loop start position in beats */
  loopStart: number;
  /** Loop end position in beats */
  loopEnd: number;
  tracks: Track[];
  /** Audio clips on the timeline. */
  clips: Clip[];
  /** MIDI clips — separate from audio clips, keyed to instrument tracks. */
  midiClips: MidiClip[];
  /** Automation lanes per track/parameter. */
  automationLanes: AutomationLane[];
}

export interface DawActions {
  /** Update BPM. Values outside [20, 300] are silently rejected. */
  setBpm: (bpm: number) => void;
  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Stop playback and return to start. */
  stop: () => void;
  /** Toggle looping. */
  toggleLoop: () => void;
  /** Set loop start point in beats. */
  setLoopStart: (beats: number) => void;
  /** Set loop end point in beats. */
  setLoopEnd: (beats: number) => void;
  /** Append a new clip to the clips array. */
  addClip: (clip: Clip) => void;
  /** Surgically mutate the timeline boundaries of an existing clip by ID. */
  updateClipBounds: (id: string, patch: { startBeat?: number; durationBeats?: number }) => void;
  /** Append a new track. */
  addTrack: (track: Track) => void;
  /** Toggle mute on a track by ID. */
  toggleMute: (id: string) => void;
  /** Toggle solo on a track by ID. */
  toggleSolo: (id: string) => void;
  /** Persist volume (dB) for a track — called only on commit (mouse-up). */
  setTrackVolume: (id: string, db: number) => void;
  /** Persist pan for a track — called only on commit (mouse-up). */
  setTrackPan: (id: string, pan: number) => void;
  /** Rename a track by ID. */
  renameTrack: (id: string, name: string) => void;
  // ── Plugin actions ────────────────────────────────────────────────────────
  /** Add a plugin instance to a track's effects chain. */
  addPlugin: (trackId: string, plugin: PluginInstance) => void;
  /** Remove a plugin instance from a track's effects chain by plugin ID. */
  removePlugin: (trackId: string, pluginId: string) => void;
  /** Persist updated plugin params — called on slider commit (mouse-up). */
  updatePluginParam: (trackId: string, pluginId: string, patch: Partial<PluginParams>) => void;
  // ── MIDI actions ───────────────────────────────────────────────────────────
  /** Add a new MIDI clip to the timeline. */
  addMidiClip: (clip: MidiClip) => void;
  /** Add a note event to an existing MIDI clip. */
  addNote: (clipId: string, note: NoteEvent) => void;
  /** Remove a note event from a MIDI clip. */
  removeNote: (clipId: string, noteId: string) => void;
  /** Move a note (update startBeat and/or pitch). */
  moveNote: (clipId: string, noteId: string, patch: { startBeat?: number; pitch?: number }) => void;
  /** Update the velocity of a note. */
  updateNoteVelocity: (clipId: string, noteId: string, velocity: number) => void;
  // ── Automation actions ──────────────────────────────────────────────────────
  /** Add or replace an automation lane for a track + target combination. */
  addAutomationLane: (lane: AutomationLane) => void;
  /** Add a node to an existing automation lane (sorted by beat). */
  addAutomationNode: (trackId: string, target: AutomationTarget, node: AutomationNode) => void;
  /** Remove an automation node by ID from its lane. */
  removeAutomationNode: (trackId: string, target: AutomationTarget, nodeId: string) => void;
  /** Update beat and/or value of an existing automation node. */
  moveAutomationNode: (trackId: string, target: AutomationTarget, nodeId: string, patch: { beat?: number; value?: number }) => void;
}

export type DawStore = DawState & DawActions;
