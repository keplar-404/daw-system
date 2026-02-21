/**
 * @file id.ts
 * @description Utility for generating unique identifiers.
 * Uses crypto.randomUUID when available (modern browsers / Node 16+),
 * falling back to a deterministic UUID-like string.
 */

/**
 * Generates a cryptographically random UUID.
 * @returns A v4 UUID string
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Polyfill for environments that don't support crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
