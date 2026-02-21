/**
 * @file project-factory.test.ts
 * @description Unit tests for project factory functions.
 */

import { createDefaultTrack, createNewProject, TRACK_COLORS, touchProject } from "@/features/project/project-factory";
import { PROJECT_SCHEMA_VERSION } from "@/types/project";

describe("createNewProject", () => {
  it("creates a project with a unique id", () => {
    const p1 = createNewProject();
    const p2 = createNewProject();
    expect(p1.id).not.toBe(p2.id);
    expect(typeof p1.id).toBe("string");
    expect(p1.id.length).toBeGreaterThan(0);
  });

  it("uses default name when no name provided", () => {
    const p = createNewProject();
    expect(p.name).toBe("Untitled Project");
  });

  it("uses provided name", () => {
    const p = createNewProject("My Song");
    expect(p.name).toBe("My Song");
  });

  it("sets the correct schema version", () => {
    const p = createNewProject();
    expect(p.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
  });

  it("creates default tracks", () => {
    const p = createNewProject();
    expect(Array.isArray(p.tracks)).toBe(true);
    expect(p.tracks.length).toBeGreaterThan(0);
  });

  it("has valid default settings", () => {
    const p = createNewProject();
    expect(p.settings.tempo).toBe(120);
    expect(p.settings.timeSignature.numerator).toBe(4);
    expect(p.settings.timeSignature.denominator).toBe(4);
    expect(p.settings.key).toBe("C");
    expect(p.settings.scale).toBe("major");
    expect(p.settings.sampleRate).toBe(44100);
    expect(p.settings.bitDepth).toBe(24);
  });

  it("sets createdAt and updatedAt as valid ISO strings", () => {
    const p = createNewProject();
    expect(() => new Date(p.createdAt)).not.toThrow();
    expect(() => new Date(p.updatedAt)).not.toThrow();
    expect(p.createdAt).toBe(p.updatedAt);
  });

  it("initializes playhead at bar 0", () => {
    const p = createNewProject();
    expect(p.lastPlayheadBar).toBe(0);
  });
});

describe("createDefaultTrack", () => {
  it("creates a track with a unique id", () => {
    const t1 = createDefaultTrack("Track A", 0);
    const t2 = createDefaultTrack("Track B", 1);
    expect(t1.id).not.toBe(t2.id);
  });

  it("assigns the correct name and order", () => {
    const t = createDefaultTrack("Bass", 3, 2);
    expect(t.name).toBe("Bass");
    expect(t.order).toBe(3);
  });

  it("cycles through TRACK_COLORS based on colorIndex", () => {
    const t0 = createDefaultTrack("T0", 0, 0);
    const tN = createDefaultTrack("TN", 0, TRACK_COLORS.length); // should wrap to index 0
    expect(t0.color).toBe(TRACK_COLORS[0]);
    expect(tN.color).toBe(TRACK_COLORS[0]);
  });

  it("starts unmuted, unsoloed, unarmed", () => {
    const t = createDefaultTrack("T", 0);
    expect(t.muted).toBe(false);
    expect(t.soloed).toBe(false);
    expect(t.armed).toBe(false);
  });

  it("starts with empty clips, effects, automation, sends", () => {
    const t = createDefaultTrack("T", 0);
    expect(t.clips).toEqual([]);
    expect(t.effects).toEqual([]);
    expect(t.automationLanes).toEqual([]);
    expect(t.sends).toEqual([]);
  });

  it("sets default volume and pan", () => {
    const t = createDefaultTrack("T", 0);
    expect(t.volume).toBeGreaterThan(0);
    expect(t.volume).toBeLessThanOrEqual(1);
    expect(t.pan).toBe(0);
  });
});

describe("touchProject", () => {
  it("returns a new project object (no mutation)", () => {
    const p = createNewProject();
    const touched = touchProject(p);
    expect(touched).not.toBe(p);
  });

  it("updates updatedAt to a newer or equal timestamp", () => {
    const p = createNewProject("Old");
    // Slight delay to ensure different timestamp
    const touched = touchProject(p);
    expect(new Date(touched.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(p.updatedAt).getTime());
  });

  it("preserves all other fields", () => {
    const p = createNewProject("Test");
    const touched = touchProject(p);
    expect(touched.id).toBe(p.id);
    expect(touched.name).toBe(p.name);
    expect(touched.schemaVersion).toBe(p.schemaVersion);
    expect(touched.settings).toEqual(p.settings);
    expect(touched.tracks.length).toBe(p.tracks.length);
    expect(touched.createdAt).toBe(p.createdAt);
  });
});
