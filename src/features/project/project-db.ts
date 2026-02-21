/**
 * @file project-db.ts
 * @description IndexedDB persistence layer for projects and sessions.
 * Provides an abstraction over the raw IDB API for storing and retrieving
 * full project documents. Designed for large project support — all heavy
 * serialization/deserialization is offloaded to the serialization worker.
 *
 * Database name: daw-ai-v1
 * Object stores:
 *   - projects: keyed by project.id, value = Project
 *   - sessions: keyed by sessionRecord.id, value = SessionRecord
 */

import type { Project, SessionRecord } from "@/types/project";

const DB_NAME = "daw-ai-v1";
const DB_VERSION = 2; // v2: added updatedAt index on sessions store
const STORE_PROJECTS = "projects";
const STORE_SESSIONS = "sessions";
const IDX_SESSIONS_UPDATED_AT = "updatedAt";

// ---------------------------------------------------------------------------
// Database bootstrap
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens (or reuses) the IndexedDB database connection.
 * @returns Promise resolving to the open IDBDatabase
 */
export function openProjectDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionsStore = db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        // Index allows retrieving records sorted by date without JS-side sort
        sessionsStore.createIndex(IDX_SESSIONS_UPDATED_AT, "updatedAt", { unique: false });
      } else {
        // Upgrade path: add index if it doesn't exist yet (v1 → v2)
        const tx = (event.target as IDBOpenDBRequest).transaction;
        if (tx) {
          const existingStore = tx.objectStore(STORE_SESSIONS);
          if (!existingStore.indexNames.contains(IDX_SESSIONS_UPDATED_AT)) {
            existingStore.createIndex(IDX_SESSIONS_UPDATED_AT, "updatedAt", { unique: false });
          }
        }
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Wraps an IDBRequest in a Promise.
 * @param request - The IDB request to promisify
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Project CRUD
// ---------------------------------------------------------------------------

/**
 * Persists a full project document to IndexedDB.
 * @param project - The project to save
 */
export async function saveProject(project: Project): Promise<void> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_PROJECTS, "readwrite");
  const store = tx.objectStore(STORE_PROJECTS);
  await promisifyRequest(store.put(project));
}

/**
 * Loads a single project by ID from IndexedDB.
 * @param id - The project UUID
 * @returns The project document or null if not found
 */
export async function loadProject(id: string): Promise<Project | null> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const store = tx.objectStore(STORE_PROJECTS);
  const result = await promisifyRequest<Project | undefined>(store.get(id));
  return result ?? null;
}

/**
 * Returns all persisted projects (summaries — full documents).
 * For large project lists, consider a lightweight summary index in the future.
 * @returns Array of all saved projects
 */
export async function listProjects(): Promise<Project[]> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const store = tx.objectStore(STORE_PROJECTS);
  return promisifyRequest<Project[]>(store.getAll());
}

/**
 * Deletes a project from IndexedDB by ID.
 * @param id - The project UUID to delete
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_PROJECTS, "readwrite");
  const store = tx.objectStore(STORE_PROJECTS);
  await promisifyRequest(store.delete(id));
}

// ---------------------------------------------------------------------------
// Session records
// ---------------------------------------------------------------------------

/**
 * Upserts a session record (lightweight pointer to a project + metadata).
 * @param record - The session record to save
 */
export async function saveSessionRecord(record: SessionRecord): Promise<void> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_SESSIONS, "readwrite");
  const store = tx.objectStore(STORE_SESSIONS);
  await promisifyRequest(store.put(record));
}

/**
 * Lists all saved session records, sorted by updatedAt descending.
 * Uses an IDB index cursor to retrieve records in sorted order without
 * a JS-side sort — O(n) read instead of O(n log n).
 * @returns Array of session records, most-recent first
 */
export async function listSessionRecords(): Promise<SessionRecord[]> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_SESSIONS, "readonly");
  const index = tx.objectStore(STORE_SESSIONS).index(IDX_SESSIONS_UPDATED_AT);

  return new Promise<SessionRecord[]>((resolve, reject) => {
    const results: SessionRecord[] = [];
    // "prev" direction iterates the index in descending order (newest first)
    const cursorReq = index.openCursor(null, "prev");
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        results.push(cursor.value as SessionRecord);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

/**
 * Deletes a session record by ID.
 * @param id - The session record ID to delete
 */
export async function deleteSessionRecord(id: string): Promise<void> {
  const db = await openProjectDatabase();
  const tx = db.transaction(STORE_SESSIONS, "readwrite");
  const store = tx.objectStore(STORE_SESSIONS);
  await promisifyRequest(store.delete(id));
}
