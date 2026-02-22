import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoopRegionOverlay } from "./LoopRegionOverlay";
import * as dawStoreModule from "@/features/daw/store/dawStore";

// ── Mock react-rnd ────────────────────────────────────────────────────────
vi.mock("react-rnd", () => ({
    Rnd: ({
        children,
        onDragStop,
        onResizeStop,
    }: any) => (
        <div
            data-testid="mock-loop-rnd"
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

describe("LoopRegionOverlay", () => {
    it("dispatches loop start and end bounds natively calculated from relative dragging offsets", () => {
        // 1. Mock the store's hook explicitly.
        const mockSetLoopStart = vi.fn();
        const mockSetLoopEnd = vi.fn();
        vi.spyOn(dawStoreModule, "useDawStore").mockImplementation((selector: any) => {
            const state = {
                isLooping: true,
                loopStart: 0,
                loopEnd: 4,
                setLoopStart: mockSetLoopStart,
                setLoopEnd: mockSetLoopEnd,
            };
            return selector(state);
        });

        // 50pxPerBeat means 200px drag -> start advances by 4 beats. 
        // Since duration is 4 beats (loopEnd - loopStart), the exact new boundaries will be 4 through 8.
        render(<LoopRegionOverlay pxPerBeat={50} height={500} />);

        const rnd = screen.getByTestId("mock-loop-rnd");
        fireEvent.dragEnd(rnd); // triggers simulated drag 200px right

        expect(mockSetLoopStart).toHaveBeenCalledWith(4);
        expect(mockSetLoopEnd).toHaveBeenCalledWith(8);
    });

    it("dispatches mapped width stretching alongside starting x changes on resizing calls natively", () => {
        const mockSetLoopStart = vi.fn();
        const mockSetLoopEnd = vi.fn();
        vi.spyOn(dawStoreModule, "useDawStore").mockImplementation((selector: any) => {
            const state = {
                isLooping: true,
                loopStart: 0,
                loopEnd: 4,
                setLoopStart: mockSetLoopStart,
                setLoopEnd: mockSetLoopEnd,
            };
            return selector(state);
        });

        // 50px per beat with a simulated 400px resize mapped starting from x=50px 
        // translates to `start: 1`, `duration: 8` -> meaning `start: 1`, `end: 9`
        render(<LoopRegionOverlay pxPerBeat={50} height={500} />);

        const rnd = screen.getByTestId("mock-loop-rnd");
        fireEvent.mouseUp(rnd); // triggers simulated resize

        expect(mockSetLoopStart).toHaveBeenCalledWith(1);
        expect(mockSetLoopEnd).toHaveBeenCalledWith(9);
    });
});
