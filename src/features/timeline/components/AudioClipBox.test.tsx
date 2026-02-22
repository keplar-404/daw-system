import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AudioClipBox } from "./AudioClipBox";
import type { Clip } from "@/features/daw/types/daw.types";

// ── Mock react-rnd ────────────────────────────────────────────────────────
// React-rnd is heavy. We mock it to just render its children and expose test
// specific triggers for testing the mathematical bounds logic inside AudioClipBox.
vi.mock("react-rnd", () => ({
    Rnd: ({
        children,
        onDragStop,
        onResizeStop,
        "data-testid": testId,
    }: any) => (
        <div
            data-testid={testId || "mock-rnd"}
            // Simulate drag 200px to the right
            onDragEnd={() => onDragStop(null, { x: 200, y: 0 })}
            // Simulate resize -> 400px wide, 50px offset x
            onMouseUp={() =>
                onResizeStop(null, "right", { offsetWidth: 400 }, null, { x: 50, y: 0 })
            }
        >
            {children}
        </div>
    ),
}));

// ── Mock WaveformOverlay ──────────────────────────────────────────────────
vi.mock("./WaveformOverlay", () => ({
    WaveformOverlay: () => <div data-testid="mock-waveform" />,
}));

describe("AudioClipBox", () => {
    const mockClip: Clip = {
        id: "clip-1",
        trackId: "track-1",
        startBeat: 0,
        durationBeats: 4,
        audioUrl: "blob-1234",
        name: "Drum Loop",
    };

    const mockUpdateBounds = vi.fn();

    it("renders the clip name correctly", () => {
        render(
            <AudioClipBox
                clip={mockClip}
                pxPerBeat={50}
                trackIndex={0}
                trackHeight={96}
                onUpdateBounds={mockUpdateBounds}
            />
        );

        expect(screen.getByText("Drum Loop")).toBeInTheDocument();
        expect(screen.getByTestId("mock-waveform")).toBeInTheDocument();
    });

    it("dispatches update bounds with strictly translated Math beats on drag", () => {
        // 200px drag / 50pxPerBeat
        // Expected newStartBeat = 4
        render(
            <AudioClipBox
                clip={mockClip}
                pxPerBeat={50}
                trackIndex={0}
                trackHeight={96}
                onUpdateBounds={mockUpdateBounds}
            />
        );

        const rnd = screen.getByTestId("mock-rnd");
        fireEvent.dragEnd(rnd); // triggers simulated drag 200px right

        expect(mockUpdateBounds).toHaveBeenCalledTimes(1);
        expect(mockUpdateBounds).toHaveBeenCalledWith("clip-1", { startBeat: 4 });
    });

    it("dispatches update bounds with both new x translating to beat and new width translating to duration on resize", () => {
        // Resize yields -> length: 400px, xOffset: 50px -> / 50pxPerBeat
        // Expected -> duration: 8, start: 1
        render(
            <AudioClipBox
                clip={mockClip}
                pxPerBeat={50}
                trackIndex={0}
                trackHeight={96}
                onUpdateBounds={mockUpdateBounds}
            />
        );

        const rnd = screen.getByTestId("mock-rnd");
        fireEvent.mouseUp(rnd); // triggers simulated resize

        expect(mockUpdateBounds).toHaveBeenCalledTimes(2); // (1 dragged + 1 resized context due to clearall not running inside it blocks generally or we can just expect with the strict object)
        expect(mockUpdateBounds).toHaveBeenLastCalledWith("clip-1", {
            startBeat: 1,
            durationBeats: 8,
        });
    });
});
