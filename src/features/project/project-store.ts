/**
 * @file project-store.ts
 * @description Zustand store for Project & Session Management.
 *
 * Responsibilities:
 * - Active project state (metadata + tracks + clips)
 * - Undo/Redo stack (diff stack of full project snapshots)
 * - IndexedDB auto-save integration
 * - Export / import delegation to serialization worker
 * - Session persistence (last open project)
 *
 * Architecture notes:
 * - This store only holds serializable metadata, never Tone.js nodes.
 * - Audio engine receives commands from UI → projectStore → engineStore.
 * - Immer is used for immutable state updates.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  deleteProject,
  listSessionRecords,
  loadProject,
  saveProject,
  saveSessionRecord,
} from "@/features/project/project-db";
import { createNewProject, touchProject } from "@/features/project/project-factory";
import { generateId } from "@/lib/id";
import type {
  AutomationLane,
  Clip,
  EffectSettings,
  Project,
  ProjectSettings,
  SessionRecord,
  Track,
  UndoEntry,
} from "@/types/project";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum undo history entries to keep in memory. */
const MAX_UNDO_HISTORY = 50;

/** Auto-save debounce delay in milliseconds. */
const AUTO_SAVE_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Derived selectors — subscribe to cheap primitives, not large objects
// ---------------------------------------------------------------------------

/**
 * Selects only whether undo is available. Avoids subscribing to the full undoPast array.
 * @example const canUndo = useProjectStore(selectCanUndo);
 */
export const selectCanUndo = (s: ProjectState): boolean => s.undoPast.length > 0;

/**
 * Selects only whether redo is available. Avoids subscribing to the full undoFuture array.
 */
export const selectCanRedo = (s: ProjectState): boolean => s.undoFuture.length > 0;

/**
 * Selects the active project name as a stable string (avoids subscribing to the whole Project object).
 */
export const selectProjectName = (s: ProjectState): string => s.activeProject?.name ?? "";

/**
 * Selects whether any project is loaded (boolean, not full object reference).
 */
export const selectHasProject = (s: ProjectState): boolean => s.activeProject !== null;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface ProjectState {
  /** Currently active project. Null before first load. */
  activeProject: Project | null;
  /** Whether the active project has unsaved changes */
  isDirty: boolean;
  /** Undo history (past snapshots) */
  undoPast: UndoEntry[];
  /** Redo history (future snapshots) */
  undoFuture: UndoEntry[];
  /** Recent project records from IndexedDB */
  recentProjects: SessionRecord[];
  /** Whether any async persistence operation is in progress */
  isSaving: boolean;
  /** Whether a project is currently loading */
  isLoading: boolean;
  /** Last error message, if any */
  error: string | null;

  // ---- Project lifecycle ----
  /** Creates a new blank project and makes it active */
  createProject: (name?: string) => void;
  /** Loads a project from IndexedDB by ID */
  loadProjectById: (id: string) => Promise<void>;
  /** Saves the active project to IndexedDB */
  saveActiveProject: () => Promise<void>;
  /** Deletes a project from IndexedDB by ID */
  deleteProjectById: (id: string) => Promise<void>;
  /** Refreshes the list of recent projects */
  refreshRecentProjects: () => Promise<void>;

  // ---- Project metadata ----
  /** Updates the project name */
  setProjectName: (name: string) => void;
  /** Updates project-level settings (tempo, time sig, key, etc.) */
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;

  // ---- Track operations ----
  /** Adds a new track to the active project */
  addTrack: (track: Track) => void;
  /** Removes a track and all its clips */
  removeTrack: (trackId: string) => void;
  /** Updates a track's properties */
  updateTrack: (trackId: string, updates: Partial<Omit<Track, "id" | "clips" | "automationLanes" | "effects">>) => void;
  /** Reorders tracks by new order index */
  reorderTracks: (orderedIds: string[]) => void;

  // ---- Clip operations ----
  /** Adds a clip to a track */
  addClip: (trackId: string, clip: Clip) => void;
  /** Removes a clip from a track */
  removeClip: (trackId: string, clipId: string) => void;
  /** Updates a clip's properties */
  updateClip: (trackId: string, clipId: string, updates: Partial<Omit<Clip, "id" | "trackId">>) => void;

  // ---- Automation ----
  /** Adds an automation lane to a track */
  addAutomationLane: (trackId: string, lane: AutomationLane) => void;
  /** Removes an automation lane */
  removeAutomationLane: (trackId: string, laneId: string) => void;

  // ---- Effects ----
  /** Adds an effect to a track's effect chain */
  addEffect: (trackId: string, effect: EffectSettings) => void;
  /** Removes an effect from a track */
  removeEffect: (trackId: string, effectId: string) => void;
  /** Updates an effect's parameters */
  updateEffect: (trackId: string, effectId: string, updates: Partial<Omit<EffectSettings, "id">>) => void;

  // ---- Undo / Redo ----
  /** Undoes the last action */
  undo: () => void;
  /** Redoes the previously undone action */
  redo: () => void;
  /** Clears undo/redo history */
  clearHistory: () => void;

  // ---- Import / Export ----
  /** Exports the active project as a downloadable JSON file */
  exportProject: () => Promise<void>;
  /** Imports a project from a JSON file */
  importProject: (file: File) => Promise<void>;

  // ---- Internal helpers ----
  /** Records a snapshot for undo (called internally before mutations) */
  _pushUndoSnapshot: (description: string) => void;
  /** Triggers the auto-save debounce timer */
  _scheduleSave: () => void;
}

// ---------------------------------------------------------------------------
// Auto-save debounce handle
// ---------------------------------------------------------------------------

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // ---- Initial state ----
    activeProject: null,
    isDirty: false,
    undoPast: [],
    undoFuture: [],
    recentProjects: [],
    isSaving: false,
    isLoading: false,
    error: null,

    // ---- Project lifecycle ----

    createProject(name) {
      const project = createNewProject(name);
      set((state) => {
        // Cast required: Immer's Draft<T> disallows direct assignment of readonly objects
        state.activeProject = project as unknown as typeof state.activeProject;
        state.isDirty = true;
        state.undoPast = [];
        state.undoFuture = [];
        state.error = null;
      });
      get()._scheduleSave();
    },

    async loadProjectById(id) {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const project = await loadProject(id);
        if (!project) throw new Error(`Project ${id} not found`);
        set((state) => {
          state.activeProject = project as unknown as typeof state.activeProject;
          state.isDirty = false;
          state.undoPast = [];
          state.undoFuture = [];
          state.isLoading = false;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : "Failed to load project";
          state.isLoading = false;
        });
      }
    },

    async saveActiveProject() {
      const { activeProject } = get();
      if (!activeProject) return;

      set((state) => {
        state.isSaving = true;
        state.error = null;
      });

      try {
        const updated = touchProject(activeProject);
        await saveProject(updated);

        const sessionRecord: SessionRecord = {
          id: updated.id,
          projectId: updated.id,
          projectName: updated.name,
          updatedAt: updated.updatedAt,
          autoSave: false,
        };
        await saveSessionRecord(sessionRecord);

        set((state) => {
          state.activeProject = updated as unknown as typeof state.activeProject;
          state.isDirty = false;
          state.isSaving = false;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : "Failed to save project";
          state.isSaving = false;
        });
      }
    },

    async deleteProjectById(id) {
      await deleteProject(id);
      await get().refreshRecentProjects();
    },

    async refreshRecentProjects() {
      try {
        const records = await listSessionRecords();
        set((state) => {
          state.recentProjects = records as unknown as typeof state.recentProjects;
        });
      } catch {
        // Silently fail on list refresh
      }
    },

    // ---- Project metadata ----

    setProjectName(name) {
      get()._pushUndoSnapshot("Rename project");
      set((state) => {
        if (!state.activeProject) return;
        state.activeProject.name = name;
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    updateProjectSettings(settings) {
      get()._pushUndoSnapshot("Update project settings");
      set((state) => {
        if (!state.activeProject) return;
        Object.assign(state.activeProject.settings, settings);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    // ---- Track operations ----

    addTrack(track) {
      get()._pushUndoSnapshot("Add track");
      set((state) => {
        if (!state.activeProject) return;
        state.activeProject.tracks.push(track as unknown as (typeof state.activeProject.tracks)[number]);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    removeTrack(trackId) {
      get()._pushUndoSnapshot("Remove track");
      set((state) => {
        if (!state.activeProject) return;
        state.activeProject.tracks = state.activeProject.tracks.filter((t) => t.id !== trackId);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    updateTrack(trackId, updates) {
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        Object.assign(track, updates);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    reorderTracks(orderedIds) {
      get()._pushUndoSnapshot("Reorder tracks");
      set((state) => {
        if (!state.activeProject) return;
        type DraftTrack = (typeof state.activeProject.tracks)[number];
        const trackMap = new Map(state.activeProject.tracks.map((t) => [t.id, t]));
        state.activeProject.tracks = orderedIds
          .map((id, index) => {
            const t = trackMap.get(id);
            if (!t) return null;
            return { ...t, order: index } as unknown as DraftTrack;
          })
          .filter(Boolean) as DraftTrack[];
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    // ---- Clip operations ----

    addClip(trackId, clip) {
      get()._pushUndoSnapshot("Add clip");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.clips.push(clip as unknown as (typeof track.clips)[number]);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    removeClip(trackId, clipId) {
      get()._pushUndoSnapshot("Remove clip");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.clips = track.clips.filter((c) => c.id !== clipId);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    updateClip(trackId, clipId, updates) {
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        const clip = track.clips.find((c) => c.id === clipId);
        if (!clip) return;
        Object.assign(clip, updates);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    // ---- Automation ----

    addAutomationLane(trackId, lane) {
      get()._pushUndoSnapshot("Add automation lane");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.automationLanes.push(lane as unknown as (typeof track.automationLanes)[number]);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    removeAutomationLane(trackId, laneId) {
      get()._pushUndoSnapshot("Remove automation lane");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.automationLanes = track.automationLanes.filter((l) => l.id !== laneId);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    // ---- Effects ----

    addEffect(trackId, effect) {
      get()._pushUndoSnapshot("Add effect");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.effects.push(effect as unknown as (typeof track.effects)[number]);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    removeEffect(trackId, effectId) {
      get()._pushUndoSnapshot("Remove effect");
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        track.effects = track.effects.filter((e) => e.id !== effectId);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    updateEffect(trackId, effectId, updates) {
      set((state) => {
        if (!state.activeProject) return;
        const track = state.activeProject.tracks.find((t) => t.id === trackId);
        if (!track) return;
        const effect = track.effects.find((e) => e.id === effectId);
        if (!effect) return;
        Object.assign(effect, updates);
        state.isDirty = true;
      });
      get()._scheduleSave();
    },

    // ---- Undo / Redo ----

    undo() {
      const { undoPast, activeProject } = get();
      if (undoPast.length === 0 || !activeProject) return;

      const previous = undoPast[undoPast.length - 1];
      const currentEntry: UndoEntry = {
        id: generateId(),
        description: "redo",
        timestamp: Date.now(),
        snapshot: activeProject,
      };

      set((state) => {
        // concat avoids a double-allocation vs [entry, ...array]
        state.undoFuture = [currentEntry as unknown as (typeof state.undoFuture)[number]].concat(
          state.undoFuture as unknown as (typeof state.undoFuture)[number][],
        ) as typeof state.undoFuture;
        state.undoPast = state.undoPast.slice(0, -1);
        state.activeProject = previous.snapshot as unknown as typeof state.activeProject;
        state.isDirty = true;
      });
    },

    redo() {
      const { undoFuture, activeProject } = get();
      if (undoFuture.length === 0 || !activeProject) return;

      const next = undoFuture[0];
      const currentEntry: UndoEntry = {
        id: generateId(),
        description: "undo",
        timestamp: Date.now(),
        snapshot: activeProject,
      };

      set((state) => {
        // concat avoids a double-allocation vs [...array, entry]
        state.undoPast = (state.undoPast as unknown as (typeof state.undoPast)[number][]).concat(
          currentEntry as unknown as (typeof state.undoPast)[number],
        ) as typeof state.undoPast;
        state.undoFuture = state.undoFuture.slice(1);
        state.activeProject = next.snapshot as unknown as typeof state.activeProject;
        state.isDirty = true;
      });
    },

    clearHistory() {
      set((state) => {
        state.undoPast = [];
        state.undoFuture = [];
      });
    },

    // ---- Import / Export ----

    async exportProject() {
      const { activeProject } = get();
      if (!activeProject) return;

      try {
        // Delegate JSON serialization to the worker to keep main thread free.
        const json = await new Promise<string>((resolve, reject) => {
          // Wrap in try-catch and avoid import.meta.url for Jest compatibility
          try {
            const worker = new Worker(new URL("../workers/serialization-worker", "http://localhost"), {
              type: "module",
            });
            worker.onmessage = (e: MessageEvent<{ type: string; json?: string; error?: string }>) => {
              worker.terminate();
              if (e.data.type === "SERIALIZE_DONE" && e.data.json) {
                resolve(e.data.json);
              } else {
                reject(new Error(e.data.error ?? "Serialization failed"));
              }
            };
            worker.onerror = (err) => {
              worker.terminate();
              reject(err);
            };
            worker.postMessage({ type: "SERIALIZE", project: activeProject });
          } catch (err) {
            reject(err);
          }
        });

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, "_")}.dawai.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: serialize on main thread if worker unavailable
        const json = JSON.stringify(activeProject, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeProject.name.replace(/\s+/g, "_")}.dawai.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },

    async importProject(file) {
      // Security: validate MIME type and file size before reading
      const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        set((state) => {
          state.error = "File too large. Maximum 50 MB.";
        });
        return;
      }

      const allowedMimes = ["application/json", "text/plain", "text/json"];
      if (!allowedMimes.includes(file.type) && !file.name.endsWith(".json")) {
        set((state) => {
          state.error = "Invalid file type. Please import a .dawai.json file.";
        });
        return;
      }

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const text = await file.text();

        // Delegate parse + schema validation to the worker
        const parsed = await new Promise<Project>((resolve, reject) => {
          try {
            const worker = new Worker(new URL("../workers/serialization-worker", "http://localhost"), {
              type: "module",
            });
            worker.onmessage = (e: MessageEvent<{ type: string; project?: Project; error?: string }>) => {
              worker.terminate();
              if (e.data.type === "DESERIALIZE_DONE" && e.data.project) {
                resolve(e.data.project);
              } else {
                reject(new Error(e.data.error ?? "Failed to parse project file"));
              }
            };
            worker.onerror = () => {
              worker.terminate();
              // Fallback: parse on main thread
              try {
                const p = JSON.parse(text) as Project;
                if (!p.id || !p.name || !Array.isArray(p.tracks)) {
                  reject(new Error("Invalid project file format."));
                } else {
                  resolve(p);
                }
              } catch (parseErr) {
                reject(parseErr);
              }
            };
            worker.postMessage({ type: "DESERIALIZE", json: text });
          } catch (err) {
            reject(err);
          }
        });

        // Assign a new ID to avoid conflicts with existing projects
        const imported: Project = { ...parsed, id: generateId(), updatedAt: new Date().toISOString() };

        await saveProject(imported);
        await get().refreshRecentProjects();

        set((state) => {
          state.activeProject = imported as unknown as typeof state.activeProject;
          state.isDirty = false;
          state.isLoading = false;
          state.undoPast = [];
          state.undoFuture = [];
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : "Failed to import project";
          state.isLoading = false;
        });
      }
    },

    // ---- Internal helpers ----

    _pushUndoSnapshot(description) {
      const { activeProject } = get();
      if (!activeProject) return;

      const entry: UndoEntry = {
        id: generateId(),
        description,
        timestamp: Date.now(),
        snapshot: activeProject,
      };

      set((state) => {
        // concat + slice avoids two separate allocations; keeps history bounded
        const len = state.undoPast.length;
        if (len < MAX_UNDO_HISTORY) {
          state.undoPast = (state.undoPast as unknown as (typeof state.undoPast)[number][]).concat(
            entry as unknown as (typeof state.undoPast)[number],
          ) as typeof state.undoPast;
        } else {
          // Ring-buffer style: drop oldest, append newest in one pass
          const capped = (state.undoPast as unknown as UndoEntry[]).slice(-(MAX_UNDO_HISTORY - 1));
          capped.push(entry);
          state.undoPast = capped as unknown as typeof state.undoPast;
        }
        // Clear redo branch on new action
        state.undoFuture = [];
      });
    },

    _scheduleSave() {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        await get().saveActiveProject();
      }, AUTO_SAVE_DELAY_MS);
    },
  })),
);
