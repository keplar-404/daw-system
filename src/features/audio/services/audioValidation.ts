import type {
  AudioFormat,
  AudioValidationError,
  AudioValidationResult,
} from "../types/audio.types";

// ── Constants ────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Known magic-number signatures for supported audio formats.
 *
 * WAV  → RIFF header:              52 49 46 46
 * OGG  → OggS capture pattern:     4F 67 67 53
 * MP3  → ID3 tag prefix:           49 44 33
 *       OR bare MPEG sync words:   FF FB | FF F3 | FF F2 | FF E0–FF EF range
 */
const MAGIC: Record<AudioFormat, (bytes: Uint8Array) => boolean> = {
  wav: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46,
  ogg: (b) => b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53,
  mp3: (b) =>
    // ID3 tag
    (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) ||
    // Bare MPEG sync word: first byte FF, second byte E0–FF (bits 5-7 set)
    (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
};

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a File by:
 * 1. Enforcing a strict 50 MB size limit
 * 2. Reading the first 4 bytes and matching against known audio magic numbers
 *
 * Throws an AudioValidationError (discriminated union) on failure.
 * Returns AudioValidationResult on success.
 *
 * @security Extension is NOT trusted. Only binary content determines format.
 */
export async function validateAudioBlob(
  file: File,
): Promise<AudioValidationResult> {
  // Guard 1 — size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const err: AudioValidationError = {
      code: "SIZE_EXCEEDED",
      maxBytes: MAX_FILE_SIZE_BYTES,
      actualBytes: file.size,
      message: `File exceeds the 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
    throw err;
  }

  // Guard 2 — magic numbers
  const headerBuffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");

  for (const [format, test] of Object.entries(MAGIC) as [
    AudioFormat,
    (b: Uint8Array) => boolean,
  ][]) {
    if (test(bytes)) {
      return { format, sizeBytes: file.size };
    }
  }

  const err: AudioValidationError = {
    code: "INVALID_FORMAT",
    detected: hex,
    message: `Unsupported file format. Detected magic bytes: ${hex}. Only WAV, MP3, and OGG are accepted.`,
  };
  throw err;
}
