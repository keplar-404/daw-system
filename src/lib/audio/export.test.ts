import { describe, it, expect, vi } from "vitest";
import { exportProjectToWav } from "./export";
import type { DawState } from "@/features/daw/types/daw.types";

// Mock the Tone.js namespace
vi.mock("tone", () => ({
    Offline: vi.fn().mockImplementation(async (callback) => {
        // Fake the user's callback execution
        await callback();
        // Return a mock ToneAudioBuffer with a .get() method returning a native AudioBuffer
        return {
            get: () => ({
                numberOfChannels: 2,
                sampleRate: 44100,
                length: 44100, // 1 sec
                getChannelData: () => new Float32Array(44100)
            })
        };
    }),
    getTransport: vi.fn(() => ({ bpm: { value: 120 } })),
    Channel: vi.fn().mockImplementation(function () {
        return {
            toDestination: vi.fn().mockReturnThis(),
            connect: vi.fn().mockReturnThis(),
            disconnect: vi.fn().mockReturnThis(),
        };
    }),
    Reverb: vi.fn().mockImplementation(function () {
        return {
            wet: { value: 0.5 },
            toDestination: vi.fn().mockReturnThis(),
            connect: vi.fn().mockReturnThis(),
            disconnect: vi.fn().mockReturnThis(),
        };
    }),
    FeedbackDelay: vi.fn().mockImplementation(function () {
        return {
            wet: { value: 0.5 },
            toDestination: vi.fn().mockReturnThis(),
            connect: vi.fn().mockReturnThis(),
            disconnect: vi.fn().mockReturnThis(),
        };
    }),
    EQ3: vi.fn().mockImplementation(function () {
        return {
            toDestination: vi.fn().mockReturnThis(),
            connect: vi.fn().mockReturnThis(),
            disconnect: vi.fn().mockReturnThis(),
        };
    }),
    PolySynth: vi.fn().mockImplementation(function () {
        return {
            connect: vi.fn().mockReturnThis(),
            triggerAttackRelease: vi.fn(),
        };
    }),
    Synth: vi.fn(),
    Player: vi.fn().mockImplementation(function () {
        return {
            connect: vi.fn().mockReturnThis(),
            load: vi.fn().mockResolvedValue(undefined),
            start: vi.fn(),
        };
    }),
}));

describe("exportProjectToWav", () => {
    it("throws an error if the timeline is empty", async () => {
        const emptyState: DawState = {
            bpm: 120,
            isPlaying: false,
            tracks: [],
            clips: [],
            midiClips: [],
            automationLanes: []
        };

        await expect(exportProjectToWav(emptyState)).rejects.toThrow("Timeline is empty");
    });

    it("successfully renders a mock project down to a Blob", async () => {
        const validState: DawState = {
            bpm: 120,
            isPlaying: false,
            tracks: [
                { id: "t1", name: "Synth", muted: false, solo: false, volume: 0, pan: 0, trackKind: "instrument" }
            ],
            clips: [],
            midiClips: [
                {
                    id: "m1",
                    trackId: "t1",
                    startBeat: 0,
                    durationBeats: 4,
                    notes: [{ id: "n1", pitch: 60, startBeat: 0, durationBeats: 1, velocity: 100 }]
                }
            ],
            automationLanes: []
        };

        const progressTracker = vi.fn();
        const blob = await exportProjectToWav(validState, progressTracker);

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe("audio/wav");
        expect(progressTracker).toHaveBeenCalledWith({ status: "done", progress: 100 });
    });
});
