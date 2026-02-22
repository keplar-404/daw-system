import localforage from "localforage";

import { validateAudioBlob } from "./audioValidation";

// ── localforage instance ─────────────────────────────────────────────────────

const audioStore = localforage.createInstance({
  name: "daw-ai",
  storeName: "audio_blobs",
  description: "Raw audio Blob storage for the DAW",
});

// ── Storage key helper ───────────────────────────────────────────────────────

const audioKey = (uuid: string) => `audio:${uuid}`;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates a File via binary magic numbers, stores the Blob in IndexedDB,
 * and returns a UUID that can be used as a clip ID.
 *
 * Throws AudioValidationError if validation fails.
 */
export async function storeAudioFile(file: File): Promise<string> {
  // 1. Validate — throws on size/format error
  await validateAudioBlob(file);

  // 2. Generate stable clip identifier
  const uuid = crypto.randomUUID();

  // 3. Persist raw Blob (preserves original MIME type)
  await audioStore.setItem(audioKey(uuid), file);

  return uuid;
}

/**
 * Retrieves a stored audio Blob by its UUID.
 * Returns null if not found.
 */
export async function getAudioBlob(uuid: string): Promise<Blob | null> {
  return audioStore.getItem<Blob>(audioKey(uuid));
}

/**
 * Removes a stored audio Blob by UUID.
 */
export async function removeAudioBlob(uuid: string): Promise<void> {
  return audioStore.removeItem(audioKey(uuid));
}
