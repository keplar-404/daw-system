import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { DawStore } from "../types/daw.types";

const BPM_MIN = 20;
const BPM_MAX = 300;

export const useDawStore = create<DawStore>()(
  immer((set) => ({
    // ── State ─────────────────────────────────────────────────────────────
    bpm: 120,
    isPlaying: false,
    isLooping: false,
    loopStart: 0,
    loopEnd: 16,
    tracks: [],
    clips: [],
    midiClips: [],
    automationLanes: [],

    // ── Transport ─────────────────────────────────────────────────────

    setBpm: (bpm) => {
      if (bpm < BPM_MIN || bpm > BPM_MAX) return;
      set((state) => {
        state.bpm = bpm;
      });
    },

    play: () => {
      set((state) => {
        state.isPlaying = true;
      });
    },

    pause: () => {
      set((state) => {
        state.isPlaying = false;
      });
    },

    stop: () => {
      set((state) => {
        state.isPlaying = false;
      });
    },

    toggleLoop: () => {
      set((state) => {
        state.isLooping = !state.isLooping;
      });
    },

    setLoopStart: (beats) => {
      set((state) => {
        state.loopStart = Math.max(0, beats);
        if (state.loopStart >= state.loopEnd) {
          state.loopEnd = state.loopStart + 1;
        }
      });
    },

    setLoopEnd: (beats) => {
      set((state) => {
        state.loopEnd = Math.max(state.loopStart + 1, beats);
      });
    },

    // ── Clips ─────────────────────────────────────────────────────────

    addClip: (clip) => {
      set((state) => {
        state.clips.push(clip);
      });
    },

    updateClipBounds: (id, patch) => {
      set((state) => {
        const c = state.clips.find((c) => c.id === id);
        if (c) Object.assign(c, patch);
      });
    },

    // ── Tracks ────────────────────────────────────────────────────────

    addTrack: (track) => {
      set((state) => {
        state.tracks.push(track);
      });
    },

    toggleMute: (id) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === id);
        if (t) t.muted = !t.muted;
      });
    },

    toggleSolo: (id) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === id);
        if (t) t.solo = !t.solo;
      });
    },

    /** Only called on slider commit (mouse-up) — not on every drag tick. */
    setTrackVolume: (id, db) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === id);
        if (t) t.volume = db;
      });
    },

    /** Only called on slider commit (mouse-up) — not on every drag tick. */
    setTrackPan: (id, pan) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === id);
        if (t) t.pan = pan;
      });
    },

    renameTrack: (id, name) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === id);
        if (t) t.name = name;
      });
    },

    // ── Plugin actions ─────────────────────────────────────────────────────

    addPlugin: (trackId, plugin) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === trackId);
        if (t) {
          if (!t.plugins) t.plugins = [];
          t.plugins.push(plugin);
        }
      });
    },

    removePlugin: (trackId, pluginId) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === trackId);
        if (t?.plugins) {
          t.plugins = t.plugins.filter((p) => p.id !== pluginId);
        }
      });
    },

    /** Only persists on slider commit — real-time updates go via audioGraphEffects. */
    updatePluginParam: (trackId, pluginId, patch) => {
      set((state) => {
        const t = state.tracks.find((t) => t.id === trackId);
        const plugin = t?.plugins?.find((p) => p.id === pluginId);
        if (plugin) {
          Object.assign(plugin.params, patch);
        }
      });
    },

    // ── MIDI actions ────────────────────────────────────────────────────────

    addMidiClip: (clip) => {
      set((state) => {
        state.midiClips.push(clip);
      });
    },

    addNote: (clipId, note) => {
      set((state) => {
        const clip = state.midiClips.find((c) => c.id === clipId);
        if (clip) clip.notes.push(note);
      });
    },

    removeNote: (clipId, noteId) => {
      set((state) => {
        const clip = state.midiClips.find((c) => c.id === clipId);
        if (clip) clip.notes = clip.notes.filter((n) => n.id !== noteId);
      });
    },

    moveNote: (clipId, noteId, patch) => {
      set((state) => {
        const clip = state.midiClips.find((c) => c.id === clipId);
        const note = clip?.notes.find((n) => n.id === noteId);
        if (note) Object.assign(note, patch);
      });
    },

    updateNoteVelocity: (clipId, noteId, velocity) => {
      set((state) => {
        const clip = state.midiClips.find((c) => c.id === clipId);
        const note = clip?.notes.find((n) => n.id === noteId);
        if (note) note.velocity = velocity;
      });
    },

    // ── Automation actions ─────────────────────────────────────────────────────

    addAutomationLane: (lane) => {
      set((state) => {
        // Replace existing lane for same trackId+target, or append
        const idx = state.automationLanes.findIndex(
          (l) => l.trackId === lane.trackId && l.target === lane.target,
        );
        if (idx >= 0) {
          state.automationLanes[idx] = lane;
        } else {
          state.automationLanes.push(lane);
        }
      });
    },

    addAutomationNode: (trackId, target, node) => {
      set((state) => {
        const lane = state.automationLanes.find(
          (l) => l.trackId === trackId && l.target === target,
        );
        if (!lane) return;
        lane.nodes.push(node);
        // Keep nodes sorted ascending by beat for linear interpolation
        lane.nodes.sort((a, b) => a.beat - b.beat);
      });
    },

    removeAutomationNode: (trackId, target, nodeId) => {
      set((state) => {
        const lane = state.automationLanes.find(
          (l) => l.trackId === trackId && l.target === target,
        );
        if (lane) {
          lane.nodes = lane.nodes.filter((n) => n.id !== nodeId);
        }
      });
    },

    moveAutomationNode: (trackId, target, nodeId, patch) => {
      set((state) => {
        const lane = state.automationLanes.find(
          (l) => l.trackId === trackId && l.target === target,
        );
        const node = lane?.nodes.find((n) => n.id === nodeId);
        if (node) {
          Object.assign(node, patch);
          // Re-sort after beat change
          if (patch.beat !== undefined && lane) {
            lane.nodes.sort((a, b) => a.beat - b.beat);
          }
        }
      });
    },
  })),
);
