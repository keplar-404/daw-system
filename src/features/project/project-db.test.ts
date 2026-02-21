/**
 * @file project-db.test.ts
 * @description Unit tests for IndexedDB persistence layer.
 */

if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}

import "fake-indexeddb/auto";

import {
  deleteProject,
  listProjects,
  listSessionRecords,
  loadProject,
  saveProject,
  saveSessionRecord,
} from "@/features/project/project-db";
import { createNewProject } from "@/features/project/project-factory";
import type { SessionRecord } from "@/types/project";

// jsdom provides indexedDB globally, but it's a stub that doesn't persist.
// We structure tests so each operation is independently verifiable.

describe("project-db — saveProject / loadProject", () => {
  it("saves and retrieves a project by id", async () => {
    const project = createNewProject("DB Test");
    await saveProject(project);
    const loaded = await loadProject(project.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(project.id);
    expect(loaded?.name).toBe("DB Test");
  });

  it("returns null for an unknown id", async () => {
    const result = await loadProject("nonexistent-id-xyz");
    expect(result).toBeNull();
  });

  it("overwrites an existing project on re-save", async () => {
    const project = createNewProject("Original Name");
    await saveProject(project);
    const updated = { ...project, name: "Updated Name" };
    await saveProject(updated);
    const loaded = await loadProject(project.id);
    expect(loaded?.name).toBe("Updated Name");
  });
});

describe("project-db — listProjects", () => {
  it("returns all saved projects", async () => {
    const p1 = createNewProject("List Test A");
    const p2 = createNewProject("List Test B");
    await saveProject(p1);
    await saveProject(p2);
    const all = await listProjects();
    const ids = all.map((p) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);
  });
});

describe("project-db — deleteProject", () => {
  it("deletes a project so it is no longer retrievable", async () => {
    const project = createNewProject("To Delete");
    await saveProject(project);
    await deleteProject(project.id);
    const loaded = await loadProject(project.id);
    expect(loaded).toBeNull();
  });
});

describe("project-db — session records", () => {
  it("saves and lists session records", async () => {
    const record: SessionRecord = {
      id: "session-1",
      projectId: "proj-1",
      projectName: "Session Test",
      updatedAt: new Date().toISOString(),
      autoSave: false,
    };
    await saveSessionRecord(record);
    const all = await listSessionRecords();
    const found = all.find((r) => r.id === record.id);
    expect(found).toBeDefined();
    expect(found?.projectName).toBe("Session Test");
  });

  it("returns records sorted by updatedAt descending", async () => {
    const older: SessionRecord = {
      id: "sess-old",
      projectId: "p1",
      projectName: "Older",
      updatedAt: "2024-01-01T00:00:00.000Z",
      autoSave: false,
    };
    const newer: SessionRecord = {
      id: "sess-new",
      projectId: "p2",
      projectName: "Newer",
      updatedAt: "2025-06-01T00:00:00.000Z",
      autoSave: false,
    };
    await saveSessionRecord(older);
    await saveSessionRecord(newer);
    const all = await listSessionRecords();
    const sessionIds = all.map((s) => s.id);
    expect(sessionIds.indexOf("sess-new")).toBeLessThan(sessionIds.indexOf("sess-old"));
  });
});
