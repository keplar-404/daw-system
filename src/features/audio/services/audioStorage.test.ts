import { beforeEach, describe, expect, it, vi } from "vitest";

import { storeAudioFile } from "./audioStorage";
import { MAX_FILE_SIZE_BYTES } from "./audioValidation";

// ── Mock localforage ─────────────────────────────────────────────────────────
// Prevent any real IndexedDB access during tests.
vi.mock("localforage", () => ({
  default: {
    createInstance: vi.fn(() => ({
      setItem: vi.fn().mockResolvedValue(undefined),
      getItem: vi.fn().mockResolvedValue(null),
      removeItem: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

// ── Test utilities ───────────────────────────────────────────────────────────

/**
 * Build a minimal mock File where:
 * - `size` is overridden to `sizeBytes`
 * - `slice().arrayBuffer()` returns a buffer containing `magicBytes`
 */
function makeMockFile(
  name: string,
  sizeBytes: number,
  magicBytes: number[],
): File {
  const buffer = new Uint8Array(magicBytes).buffer;
  const blob = new Blob([buffer]);

  const file = new File([blob], name, { type: "audio/wav" });

  // Override size (File.size is read-only so we use Object.defineProperty)
  Object.defineProperty(file, "size", { value: sizeBytes, configurable: true });

  // Override slice so arrayBuffer returns our chosen magic bytes
  vi.spyOn(file, "slice").mockReturnValue(
    new Blob([new Uint8Array(magicBytes).buffer]),
  );

  return file;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("storeAudioFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1 — Size exceeded
  it("throws SIZE_EXCEEDED when file exceeds 50 MB", async () => {
    const oversizedFile = makeMockFile(
      "big.wav",
      MAX_FILE_SIZE_BYTES + 1, // 50 MB + 1 byte
      [0x52, 0x49, 0x46, 0x46], // Valid WAV magic (size check runs first)
    );

    await expect(storeAudioFile(oversizedFile)).rejects.toMatchObject({
      code: "SIZE_EXCEEDED",
    });
  });

  // Test 2 — Invalid magic number (fake WAV with text content)
  it("throws INVALID_FORMAT when file has .wav extension but text magic bytes", async () => {
    // '<scr' → first 4 bytes of a potential <script> XSS payload
    const fakeWav = makeMockFile(
      "evil.wav",
      1024, // Small, passes size check
      [0x3c, 0x73, 0x63, 0x72], // '<scr'
    );

    await expect(storeAudioFile(fakeWav)).rejects.toMatchObject({
      code: "INVALID_FORMAT",
    });
  });

  // Test 3 — Valid WAV returns a UUID
  it("resolves with a UUID string for a valid WAV file", async () => {
    const validWav = makeMockFile(
      "track.wav",
      1024 * 100, // 100 KB — well under 50 MB
      [0x52, 0x49, 0x46, 0x46], // RIFF — valid WAV magic
    );

    const result = await storeAudioFile(validWav);

    // UUID v4 pattern: 8-4-4-4-12 hex chars separated by hyphens
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
