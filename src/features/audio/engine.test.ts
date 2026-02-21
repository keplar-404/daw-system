/**
 * @file engine.test.ts
 * @description Unit tests for the Tone.js audio engine singleton.
 * Mocks Tone.js to ensure tests run fast and without AudioContext errors in Node.
 */

// ---- Mock Tone.js ----
const mockTriggerAttackReleaseAccent = jest.fn();
const mockTriggerAttackReleaseBeat = jest.fn();

const mockToneTransport = {
  bpm: { value: 120 },
  timeSignature: [4, 4],
  state: "stopped",
  start: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn(),
};

const mockSequenceStart = jest.fn();
const mockSequenceStop = jest.fn();
const mockSequenceDispose = jest.fn();
let sequenceCallback: ((time: number, type: "accent" | "beat") => void) | null = null;
let sequenceEvents: string[] | null = null;

const mockTone = {
  start: jest.fn().mockResolvedValue(true),
  now: jest.fn().mockReturnValue(0),
  Transport: mockToneTransport,
  Synth: jest.fn().mockImplementation((opts) => {
    // Distinguish synths by volume setting used in engine.ts
    const isAccent = opts.volume === -4;
    return {
      toDestination: jest.fn().mockReturnValue({
        triggerAttackRelease: isAccent ? mockTriggerAttackReleaseAccent : mockTriggerAttackReleaseBeat,
        dispose: jest.fn(),
      }),
    };
  }),
  Sequence: jest.fn().mockImplementation((callback, events, _time) => {
    sequenceCallback = callback;
    sequenceEvents = events;
    return {
      start: mockSequenceStart,
      stop: mockSequenceStop,
      dispose: mockSequenceDispose,
    };
  }),
};

jest.mock("tone", () => mockTone);

// Mute IS_BROWSER check by overriding it if necessary, or let engine use it
// In jsdom environment, window is defined so IS_BROWSER is true.
import * as engine from "./engine";

describe("Audio Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToneTransport.bpm.value = 120;
    mockToneTransport.timeSignature = [4, 4];
    mockToneTransport.state = "stopped";
    sequenceCallback = null;
    sequenceEvents = null;
    engine.engineSetMetronome(false);
    engine.engineSetCountIn(false);
    engine.engineSetTempo(120);
    engine.engineSetTimeSignature(4, 4);
  });

  afterEach(() => {
    engine.engineDispose();
  });

  describe("Tempo", () => {
    it("should set transport tempo", async () => {
      // Must ensureInit first so Tone is loaded
      await engine.enginePlay();
      engine.engineSetTempo(135);
      expect(mockToneTransport.bpm.value).toBe(135);
    });
  });

  describe("Time Signature", () => {
    it("should set time signature and rebuild sequence", async () => {
      await engine.enginePlay();
      engine.engineSetTimeSignature(3, 4);
      expect(mockToneTransport.timeSignature).toEqual([3, 4]);
      // Should rebuild sequence with 3 beats (accent, beat, beat)
      expect(mockTone.Sequence).toHaveBeenCalled();
      expect(sequenceEvents).toEqual(["accent", "beat", "beat"]);
    });
  });

  describe("Playback Controls", () => {
    it("should start transport without count-in", async () => {
      await engine.enginePlay();
      expect(mockTone.start).toHaveBeenCalled(); // Resumes AudioContext
      expect(mockToneTransport.start).toHaveBeenCalledWith(); // No time offset
    });

    it("should start transport with count-in", async () => {
      engine.engineSetCountIn(true);
      engine.engineSetTempo(120); // 1 beat = 0.5s
      await engine.enginePlay();

      // Lookahead = 0.05
      // 4 beats count in = 0.05 + 4 * 0.5 = 2.05
      expect(mockToneTransport.start).toHaveBeenCalledWith(2.05);

      // Clicks should have been scheduled manually during count-in
      expect(mockTriggerAttackReleaseAccent).toHaveBeenCalledTimes(1);
      expect(mockTriggerAttackReleaseBeat).toHaveBeenCalledTimes(3);
    });

    it("should pause transport", async () => {
      await engine.enginePlay();
      engine.enginePause();
      expect(mockToneTransport.pause).toHaveBeenCalled();
    });

    it("should stop transport", async () => {
      await engine.enginePlay();
      engine.engineStop();
      expect(mockToneTransport.stop).toHaveBeenCalled();
    });

    it("should get playback state", async () => {
      await engine.enginePlay();
      mockToneTransport.state = "started";
      expect(engine.engineGetPlayState()).toBe("started");
    });
  });

  describe("Metronome", () => {
    it("should trigger synths when enabled and sequence runs", async () => {
      await engine.enginePlay(); // Init + create sequence
      engine.engineSetMetronome(true);

      expect(sequenceCallback).not.toBeNull();

      // Simulate Tone.js calling the sequence callback
      if (sequenceCallback) {
        sequenceCallback(1.0, "accent");
        expect(mockTriggerAttackReleaseAccent).toHaveBeenCalledWith("C5", "64n", 1.0);

        sequenceCallback(1.5, "beat");
        expect(mockTriggerAttackReleaseBeat).toHaveBeenCalledWith("C4", "64n", 1.5);
      }
    });

    it("should NOT trigger synths when disabled", async () => {
      await engine.enginePlay();
      engine.engineSetMetronome(false);

      if (sequenceCallback) {
        sequenceCallback(1.0, "accent");
        expect(mockTriggerAttackReleaseAccent).not.toHaveBeenCalled();
      }
    });
  });

  describe("Grid Utils", () => {
    it("snapGridToToneTime returns correct mapping", () => {
      expect(engine.snapGridToToneTime("bar")).toBe("1m");
      expect(engine.snapGridToToneTime("1/4")).toBe("4n");
      expect(engine.snapGridToToneTime("1/16")).toBe("16n");
    });
  });
});
