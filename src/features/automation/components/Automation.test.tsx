import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDawStore } from "@/features/daw/store/dawStore";
import { scheduleAutomation } from "../services/automationScheduler";

// ── Mock audioGraph ────────────────────────────────────────────────────────
const { mockSetValueAtTime, mockCancelScheduledValues, mockLinearRampToValueAtTime } =
    vi.hoisted(() => ({
        mockSetValueAtTime: vi.fn(),
        mockCancelScheduledValues: vi.fn(),
        mockLinearRampToValueAtTime: vi.fn(),
    }));

vi.mock("@/features/tracks/services/audioGraph", () => ({
    getChannel: vi.fn().mockReturnValue({
        volume: {
            setValueAtTime: mockSetValueAtTime,
            cancelScheduledValues: mockCancelScheduledValues,
            linearRampToValueAtTime: mockLinearRampToValueAtTime,
        },
        pan: {
            setValueAtTime: vi.fn(),
            cancelScheduledValues: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
        },
    }),
}));

// ── Mock Tone.js ───────────────────────────────────────────────────────────
vi.mock("tone", () => ({
    getContext: () => ({
        currentTime: 0, // start of audio context
    }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────
function resetStore() {
    useDawStore.setState({
        bpm: 120,
        isPlaying: false,
        tracks: [],
        clips: [],
        midiClips: [],
        automationLanes: [],
    });
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe("Automation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStore();
    });

    // Test 1: Add automation point at beat 2 with volume -6dB -> Zustand store saves this node.
    it("saves a new automation node to the Zustand store", () => {
        // 1. Setup lane first
        useDawStore.getState().addAutomationLane({
            trackId: "track-1",
            target: "volume",
            nodes: [],
        });

        // 2. Add node
        act(() => {
            useDawStore.getState().addAutomationNode("track-1", "volume", {
                id: "node-1",
                beat: 2,
                value: -6, // -6 dB
            });
        });

        // 3. Assert
        const lanes = useDawStore.getState().automationLanes;
        expect(lanes).toHaveLength(1);
        expect(lanes[0].nodes).toHaveLength(1);
        expect(lanes[0].nodes[0].beat).toBe(2);
        expect(lanes[0].nodes[0].value).toBe(-6);
    });

    // Test 2: Trigger playback; assert the mocked setValueAtTime is called with the correct timing.
    it("schedules automation curves using Tone.js timing methods", async () => {
        const lane = {
            trackId: "track-1",
            target: "volume" as const,
            nodes: [
                { id: "n1", beat: 0, value: 0 },
                { id: "n2", beat: 2, value: -6 },
            ],
        };

        useDawStore.getState().addAutomationLane(lane);

        // Call schedule (our hook does this when isPlaying toggles to true)
        await scheduleAutomation([lane], 120);

        // With BPM = 120 (2 beats per second):
        // beat 0 -> time 0
        // beat 2 -> time 1.0
        expect(mockCancelScheduledValues).toHaveBeenCalledWith(0);

        // First node uses setValueAtTime
        expect(mockSetValueAtTime).toHaveBeenCalledTimes(1);
        expect(mockSetValueAtTime).toHaveBeenCalledWith(0, 0);

        // Subsequent nodes use linearRampToValueAtTime
        expect(mockLinearRampToValueAtTime).toHaveBeenCalledTimes(1);
        expect(mockLinearRampToValueAtTime).toHaveBeenCalledWith(-6, 1.0);
    });
});
