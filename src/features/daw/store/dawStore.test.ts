import { beforeEach, describe, expect, it } from "vitest";

import { useDawStore } from "./dawStore";

/** Reset the store to initial state before each test to ensure isolation. */
function resetStore() {
  useDawStore.setState({
    bpm: 120,
    isPlaying: false,
    tracks: [],
    clips: [],
    midiClips: [],
    automationLanes: [],
  });
}

describe("useDawStore", () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Test 1: Initial state ─────────────────────────────────────────────────
  it("initializes with isPlaying=false and bpm=120", () => {
    const { bpm, isPlaying } = useDawStore.getState();
    expect(isPlaying).toBe(false);
    expect(bpm).toBe(120);
  });

  // ── Test 2: togglePlay ────────────────────────────────────────────────────
  it("play and pause correctly swap the boolean", () => {
    const { play, pause } = useDawStore.getState();

    play();
    expect(useDawStore.getState().isPlaying).toBe(true);

    pause();
    expect(useDawStore.getState().isPlaying).toBe(false);
  });

  // ── Test 3: setBpm guards ─────────────────────────────────────────────────
  describe("setBpm", () => {
    it("updates bpm for valid values", () => {
      useDawStore.getState().setBpm(140);
      expect(useDawStore.getState().bpm).toBe(140);
    });

    it("rejects bpm below 20 (does not update)", () => {
      useDawStore.getState().setBpm(19);
      expect(useDawStore.getState().bpm).toBe(120);
    });

    it("rejects bpm above 300 (does not update)", () => {
      useDawStore.getState().setBpm(301);
      expect(useDawStore.getState().bpm).toBe(120);
    });

    it("accepts boundary values 20 and 300", () => {
      useDawStore.getState().setBpm(20);
      expect(useDawStore.getState().bpm).toBe(20);

      useDawStore.getState().setBpm(300);
      expect(useDawStore.getState().bpm).toBe(300);
    });
  });
});
