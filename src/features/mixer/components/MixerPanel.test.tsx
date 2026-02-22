import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDawStore } from "@/features/daw/store/dawStore";
import type { Track } from "@/features/daw/types/daw.types";
import { MixerPanel } from "./MixerPanel";

// ── Mock Slider (same contract as TrackList.test.tsx) ─────────────────────────
// Single-click → onValueChange only (simulates drag tick)
// Double-click → onValueCommit only (simulates pointer-up / commit)
vi.mock("@/components/ui/slider", () => ({
    Slider: ({
        onValueChange,
        onValueCommit,
        defaultValue,
        min = 0,
        "aria-label": label,
    }: {
        onValueChange?: (v: number[]) => void;
        onValueCommit?: (v: number[]) => void;
        defaultValue?: number[];
        min?: number;
        "aria-label"?: string;
    }) => (
        <div
            role="slider"
            aria-label={label ?? "Slider"}
            aria-valuenow={defaultValue?.[0] ?? min}
            tabIndex={0}
            data-testid={`mock-slider-${(label ?? "slider").toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => onValueChange?.([(defaultValue?.[0] ?? min) - 0.1])}
            onKeyDown={() => onValueChange?.([(defaultValue?.[0] ?? min) - 0.1])}
            onDoubleClick={() => onValueCommit?.([(defaultValue?.[0] ?? min) - 0.1])}
        />
    ),
}));

// ── Mock shadcn Select ────────────────────────────────────────────────────────
// Stateless stub: SelectTrigger triggers onValueChange with "reverb" by default.
vi.mock("@/components/ui/select", () => ({
    Select: ({
        children,
        onValueChange,
    }: {
        children: React.ReactNode;
        onValueChange?: (v: string) => void;
    }) => (
        <div data-testid="mock-select" onClick={() => onValueChange?.("reverb")} onKeyDown={() => onValueChange?.("reverb")}>
            {children}
        </div>
    ),
    SelectTrigger: ({ children, "aria-label": label }: { children: React.ReactNode; "aria-label"?: string }) => (
        <button type="button" aria-label={label}>{children}</button>
    ),
    SelectValue: () => <span>reverb</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
        <div data-value={value}>{children}</div>
    ),
}));

// ── Mock audioGraphEffects ────────────────────────────────────────────────────
const mockInsertEffect = vi.fn().mockResolvedValue(undefined);
const mockRemoveEffect = vi.fn();
const mockSetEffectParam = vi.fn();

vi.mock("../services/audioGraphEffects", () => ({
    insertEffect: (...args: unknown[]) => mockInsertEffect(...args),
    removeEffect: (...args: unknown[]) => mockRemoveEffect(...args),
    setEffectParam: (...args: unknown[]) => mockSetEffectParam(...args),
    disposeTrackEffects: vi.fn(),
    getEffect: vi.fn(),
}));

// ── Test helpers ──────────────────────────────────────────────────────────────

const MOCK_TRACK: Track = {
    id: "track-1",
    name: "Track 1",
    muted: false,
    solo: false,
    volume: 0,
    pan: 0,
    plugins: [],
};

const TRACK_WITH_REVERB: Track = {
    ...MOCK_TRACK,
    plugins: [
        {
            id: "plugin-1",
            type: "reverb",
            params: { type: "reverb", decay: 1.5, mix: 0.5 },
        },
    ],
};

function resetStore(tracks: Track[] = []) {
    useDawStore.setState({ bpm: 120, isPlaying: false, tracks, clips: [] });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MixerPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStore([MOCK_TRACK]);
    });

    // ── Test 1: Add Reverb → Zustand updates with new plugin ─────────────────
    it("adds a Reverb plugin to the store when the Add button is clicked", async () => {
        render(<MixerPanel />);

        const addBtn = screen.getByTestId("add-effect-btn-track-1");

        // Wrap in act so React flushes the async addPlugin → storeAddPlugin state updates
        await act(async () => {
            fireEvent.click(addBtn);
            // Yield to the microtask queue so the resolved mockInsertEffect settles
            await Promise.resolve();
        });

        const plugins = useDawStore.getState().tracks[0]?.plugins ?? [];
        expect(plugins).toHaveLength(1);
        expect(plugins[0].type).toBe("reverb");
        // insertEffect must have been called (audio graph wired up)
        expect(mockInsertEffect).toHaveBeenCalledTimes(1);
        expect(mockInsertEffect).toHaveBeenCalledWith(
            "track-1",
            expect.any(String),
            "reverb",
            expect.objectContaining({ type: "reverb" }),
        );
    });

    // ── Test 2: Mix slider real-time path — no re-render loop ───────────────
    it("calls setEffectParam on drag (not updatePluginParam) and updatePluginParam on commit", async () => {
        // Pre-seed store with a track that already has a reverb plugin
        const storeUpdatePluginParam = vi.fn();
        resetStore([TRACK_WITH_REVERB]);

        // Spy on the store action
        useDawStore.setState({ updatePluginParam: storeUpdatePluginParam } as Partial<ReturnType<typeof useDawStore.getState>>);

        render(<MixerPanel />);

        // Find the Mix slider for the reverb plugin
        const mixSlider = screen.getByTestId(
            "mock-slider-mix-for-reverb-on-track-track-1",
        );

        // Single click = onValueChange = real-time path (audio only, no Zustand)
        fireEvent.click(mixSlider);
        expect(mockSetEffectParam).toHaveBeenCalledTimes(1);
        expect(storeUpdatePluginParam).not.toHaveBeenCalled();

        // Double click = onValueCommit = commit path (Zustand)
        fireEvent.dblClick(mixSlider);
        expect(storeUpdatePluginParam).toHaveBeenCalledTimes(1);
        // setEffectParam should still be exactly 1 (not called again on commit)
        expect(mockSetEffectParam).toHaveBeenCalledTimes(1);
    });
});
