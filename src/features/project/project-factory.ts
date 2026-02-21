/**
 * @file project-factory.ts
 * @description Factory helpers for creating default project structures.
 * Used when the user creates a new project.
 */

import { generateId } from "@/lib/id";
import type { Project, ProjectSettings, Track } from "@/types/project";
import { PROJECT_SCHEMA_VERSION } from "@/types/project";

/** Default project settings for a new project */
const DEFAULT_SETTINGS: ProjectSettings = {
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  key: "C",
  scale: "major",
  lengthBars: 64,
  sampleRate: 44100,
  bitDepth: 24,
};

/** Default track colors palette */
export const TRACK_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f97316", // orange
] as const;

/**
 * Creates a default audio track with sane defaults.
 * @param name - Track display name
 * @param order - Position order in track list
 * @param colorIndex - Color index from TRACK_COLORS
 */
export function createDefaultTrack(name: string, order: number, colorIndex = 0): Track {
  return {
    id: generateId(),
    name,
    type: "audio",
    color: TRACK_COLORS[colorIndex % TRACK_COLORS.length],
    volume: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    clips: [],
    automationLanes: [],
    effects: [],
    sends: [],
    order,
  };
}

/**
 * Creates a brand new empty project with default settings.
 * @param name - Project display name (defaults to "Untitled Project")
 */
export function createNewProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();
  const defaultTracks: Track[] = [
    createDefaultTrack("Track 1", 0, 0),
    createDefaultTrack("Track 2", 1, 1),
    createDefaultTrack("Track 3", 2, 2),
  ];

  return {
    id: generateId(),
    name,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    settings: DEFAULT_SETTINGS,
    tracks: defaultTracks,
    createdAt: now,
    updatedAt: now,
    lastPlayheadBar: 0,
  };
}

/**
 * Returns a shallow copy of a project with a fresh updatedAt timestamp.
 * Used to mark a project as dirty before saving.
 * @param project - Source project
 */
export function touchProject(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}
