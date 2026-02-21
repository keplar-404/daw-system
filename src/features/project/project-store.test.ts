/**
 * @file project-store.test.ts
 * @description Unit tests for the Zustand projectStore.
 * IndexedDB operations are mocked to test pure state logic in isolation.
 */

import { act } from "react";
import { useProjectStore } from "@/features/project/project-store";

// ---------------------------------------------------------------------------
// Mock IndexedDB persistence layer
// ---------------------------------------------------------------------------

jest.mock("@/features/project/project-db", () => ({
  saveProject: jest.fn().mockResolvedValue(undefined),
  loadProject: jest.fn().mockResolvedValue(null),
  listProjects: jest.fn().mockResolvedValue([]),
  deleteProject: jest.fn().mockResolvedValue(undefined),
  saveSessionRecord: jest.fn().mockResolvedValue(undefined),
  listSessionRecords: jest.fn().mockResolvedValue([]),
  deleteSessionRecord: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useProjectStore.setState({
    activeProject: null,
    isDirty: false,
    undoPast: [],
    undoFuture: [],
    recentProjects: [],
    isSaving: false,
    isLoading: false,
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useProjectStore — createProject", () => {
  beforeEach(resetStore);

  it("creates a new active project", () => {
    act(() => {
      useProjectStore.getState().createProject("Test Song");
    });
    const { activeProject } = useProjectStore.getState();
    expect(activeProject).not.toBeNull();
    expect(activeProject?.name).toBe("Test Song");
  });

  it("marks project as dirty after creation", () => {
    act(() => {
      useProjectStore.getState().createProject();
    });
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it("resets undo/redo stacks on new project", () => {
    act(() => {
      useProjectStore.getState().createProject("First");
      useProjectStore.getState().setProjectName("Modified");
      useProjectStore.getState().createProject("Second");
    });
    const { undoPast, undoFuture } = useProjectStore.getState();
    expect(undoPast).toHaveLength(0);
    expect(undoFuture).toHaveLength(0);
  });
});

describe("useProjectStore — setProjectName", () => {
  beforeEach(() => {
    resetStore();
    act(() => useProjectStore.getState().createProject("Original"));
  });

  it("updates the project name", () => {
    act(() => {
      useProjectStore.getState().setProjectName("Renamed");
    });
    expect(useProjectStore.getState().activeProject?.name).toBe("Renamed");
  });

  it("marks dirty after rename", () => {
    act(() => {
      useProjectStore.getState().setProjectName("Dirty");
    });
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it("pushes undo snapshot before rename", () => {
    act(() => {
      useProjectStore.getState().setProjectName("After Rename");
    });
    expect(useProjectStore.getState().undoPast.length).toBeGreaterThan(0);
  });
});

describe("useProjectStore — updateProjectSettings", () => {
  beforeEach(() => {
    resetStore();
    act(() => useProjectStore.getState().createProject());
  });

  it("updates tempo", () => {
    act(() => {
      useProjectStore.getState().updateProjectSettings({ tempo: 140 });
    });
    expect(useProjectStore.getState().activeProject?.settings.tempo).toBe(140);
  });

  it("updates time signature", () => {
    act(() => {
      useProjectStore.getState().updateProjectSettings({ timeSignature: { numerator: 3, denominator: 4 } });
    });
    expect(useProjectStore.getState().activeProject?.settings.timeSignature.numerator).toBe(3);
  });
});

describe("useProjectStore — Track CRUD", () => {
  beforeEach(() => {
    resetStore();
    act(() => useProjectStore.getState().createProject());
  });

  it("adds a track", () => {
    const initialCount = useProjectStore.getState().activeProject?.tracks.length ?? 0;
    act(() => {
      useProjectStore.getState().addTrack({
        id: "t-1",
        name: "New Track",
        type: "audio",
        color: "#fff",
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        armed: false,
        clips: [],
        automationLanes: [],
        effects: [],
        sends: [],
        order: initialCount,
      });
    });
    expect(useProjectStore.getState().activeProject?.tracks.length).toBe(initialCount + 1);
  });

  it("removes a track by id", () => {
    act(() => {
      useProjectStore.getState().addTrack({
        id: "t-removable",
        name: "To Remove",
        type: "audio",
        color: "#000",
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        armed: false,
        clips: [],
        automationLanes: [],
        effects: [],
        sends: [],
        order: 99,
      });
    });
    act(() => {
      useProjectStore.getState().removeTrack("t-removable");
    });
    const tracks = useProjectStore.getState().activeProject?.tracks ?? [];
    expect(tracks.find((t) => t.id === "t-removable")).toBeUndefined();
  });

  it("updates track volume", () => {
    const trackId = useProjectStore.getState().activeProject?.tracks[0]?.id;
    if (!trackId) return;
    act(() => {
      useProjectStore.getState().updateTrack(trackId, { volume: 0.5 });
    });
    const track = useProjectStore.getState().activeProject?.tracks.find((t) => t.id === trackId);
    expect(track?.volume).toBe(0.5);
  });
});

describe("useProjectStore — Undo / Redo", () => {
  beforeEach(() => {
    resetStore();
    act(() => useProjectStore.getState().createProject("Initial"));
  });

  it("undo restores previous name", () => {
    act(() => useProjectStore.getState().setProjectName("Modified"));
    const before = useProjectStore.getState().activeProject?.name;
    expect(before).toBe("Modified");

    act(() => useProjectStore.getState().undo());
    const after = useProjectStore.getState().activeProject?.name;
    expect(after).toBe("Initial");
  });

  it("redo reapplies change after undo", () => {
    act(() => useProjectStore.getState().setProjectName("Modified"));
    act(() => useProjectStore.getState().undo());
    act(() => useProjectStore.getState().redo());
    expect(useProjectStore.getState().activeProject?.name).toBe("Modified");
  });

  it("clears redo stack when new action is taken after undo", () => {
    act(() => useProjectStore.getState().setProjectName("A"));
    act(() => useProjectStore.getState().undo());
    act(() => useProjectStore.getState().setProjectName("B")); // new action clears redo
    expect(useProjectStore.getState().undoFuture).toHaveLength(0);
  });

  it("does nothing when undo stack is empty", () => {
    expect(useProjectStore.getState().undoPast).toHaveLength(0);
    const nameBefore = useProjectStore.getState().activeProject?.name;
    act(() => useProjectStore.getState().undo());
    expect(useProjectStore.getState().activeProject?.name).toBe(nameBefore);
  });

  it("clearHistory empties both stacks", () => {
    act(() => useProjectStore.getState().setProjectName("X"));
    act(() => useProjectStore.getState().clearHistory());
    expect(useProjectStore.getState().undoPast).toHaveLength(0);
    expect(useProjectStore.getState().undoFuture).toHaveLength(0);
  });
});

describe("useProjectStore — importProject", () => {
  beforeEach(resetStore);

  it("sets error for oversized file", async () => {
    const largeArray = new Uint8Array(51 * 1024 * 1024);
    const largeFile = new File([largeArray], "big.json", {
      type: "application/json",
    });
    await act(async () => {
      await useProjectStore.getState().importProject(largeFile);
    });
    expect(useProjectStore.getState().error).toMatch(/too large/i);
    expect(useProjectStore.getState().isLoading).toBe(false);
  });

  it("sets error for invalid JSON", async () => {
    const badFile = new File(["not valid json!!!"], "bad.json", {
      type: "application/json",
    });
    await act(async () => {
      await useProjectStore.getState().importProject(badFile);
    });
    expect(useProjectStore.getState().error).not.toBeNull();
  });
});
