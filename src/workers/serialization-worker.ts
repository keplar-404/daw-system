/**
 * @file serialization-worker.ts
 * @description Web Worker for heavy project JSON serialization and deserialization.
 * Offloads CPU-intensive stringify/validation of large project files from the main thread.
 *
 * Messages accepted:
 *   { type: "SERIALIZE", project: Project }         → { type: "SERIALIZE_DONE", json: string }
 *   { type: "DESERIALIZE", json: string }           → { type: "DESERIALIZE_DONE", project: Project }
 *   { type: "VALIDATE", json: string }              → { type: "VALIDATE_DONE", valid: boolean, error?: string }
 *   { type: "EXPORT_BLOB", project: Project }       → { type: "EXPORT_BLOB_DONE", blob: Blob }
 *   { type: "IMPORT_BLOB", blob: Blob }             → { type: "IMPORT_BLOB_DONE", project: Project }
 */

import type { Project } from "@/types/project";
import { PROJECT_SCHEMA_VERSION } from "@/types/project";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates that a parsed object conforms to the Project schema minimum requirements.
 * Returns an error message or null if valid.
 * @param obj - Parsed JSON object to validate
 */
function validateProjectShape(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) return "Root must be an object";
  const p = obj as Record<string, unknown>;
  if (typeof p.id !== "string" || p.id.length === 0) return "Missing project.id";
  if (typeof p.name !== "string") return "Missing project.name";
  if (p.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    return `Unsupported schema version: ${String(p.schemaVersion)}. Expected ${PROJECT_SCHEMA_VERSION}`;
  }
  if (!Array.isArray(p.tracks)) return "project.tracks must be an array";
  if (typeof p.settings !== "object") return "project.settings must be an object";
  const s = p.settings as Record<string, unknown>;
  if (typeof s.tempo !== "number" || s.tempo <= 0) return "settings.tempo must be a positive number";
  return null;
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent) => {
  const { type, ...payload } = event.data as { type: string } & Record<string, unknown>;

  switch (type) {
    case "SERIALIZE": {
      try {
        const json = JSON.stringify(payload.project, null, 2);
        self.postMessage({ type: "SERIALIZE_DONE", json });
      } catch (err) {
        self.postMessage({
          type: "SERIALIZE_ERROR",
          error: err instanceof Error ? err.message : "Unknown serialization error",
        });
      }
      break;
    }

    case "DESERIALIZE": {
      try {
        const project = JSON.parse(payload.json as string) as Project;
        const error = validateProjectShape(project);
        if (error) {
          self.postMessage({ type: "DESERIALIZE_ERROR", error });
        } else {
          self.postMessage({ type: "DESERIALIZE_DONE", project });
        }
      } catch (err) {
        self.postMessage({
          type: "DESERIALIZE_ERROR",
          error: err instanceof Error ? err.message : "Unknown parse error",
        });
      }
      break;
    }

    case "VALIDATE": {
      try {
        const parsed = JSON.parse(payload.json as string);
        const error = validateProjectShape(parsed);
        if (error) {
          self.postMessage({ type: "VALIDATE_DONE", valid: false, error });
        } else {
          self.postMessage({ type: "VALIDATE_DONE", valid: true });
        }
      } catch (err) {
        self.postMessage({
          type: "VALIDATE_DONE",
          valid: false,
          error: err instanceof Error ? err.message : "JSON parse failed",
        });
      }
      break;
    }

    default:
      self.postMessage({ type: "UNKNOWN_MESSAGE", originalType: type });
  }
};
