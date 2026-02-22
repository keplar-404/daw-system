import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { AudioDropzone } from "./AudioDropzone";
import { useDawStore } from "@/features/daw/store/dawStore";

// Mock localforage
vi.mock("localforage", () => ({
    default: {
        setItem: vi.fn().mockResolvedValue(undefined),
    },
}));

// Mock Zustand store hooks
vi.mock("@/features/daw/store/dawStore", () => {
    const mockAddTrack = vi.fn();
    const mockAddClip = vi.fn();
    return {
        useDawStore: vi.fn((selector) => {
            const state = {
                addTrack: mockAddTrack,
                addClip: mockAddClip,
            };
            return selector(state);
        }),
    };
});

describe("AudioDropzone", () => {
    it("renders children successfully", () => {
        render(
            <AudioDropzone>
                <div data-testid="child-element">Canvas</div>
            </AudioDropzone>
        );
        expect(screen.getByTestId("child-element")).toBeInTheDocument();
    });

    it("handles standard dropping of valid audio files and fires store dispatches", async () => {
        render(
            <AudioDropzone>
                <div data-testid="child-element">Canvas</div>
            </AudioDropzone>
        );

        const file = new File(["dummy audio content"], "test-drum-loop.wav", {
            type: "audio/wav",
        });

        // Simulate input change as jest-dom drag/drop simulation inside react-dropzone 
        // requires digging into the hidden input.
        const input = document.querySelector("input[type='file']") as HTMLInputElement;
        expect(input).toBeInTheDocument();

        await userEvent.upload(input, file);

        // Verify Zustand got called
        const mockAddTrack = useDawStore((s) => s.addTrack);
        const mockAddClip = useDawStore((s) => s.addClip);

        await waitFor(() => {
            expect(mockAddTrack).toHaveBeenCalledTimes(1);
            expect(mockAddTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "test-drum-loop.wav",
                    trackKind: "audio",
                })
            );

            expect(mockAddClip).toHaveBeenCalledTimes(1);
            expect(mockAddClip).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "test-drum-loop.wav",
                    durationBeats: 16,
                    startBeat: 0,
                })
            );
        });

        // Verify localforage IndexedDB save
        const { default: localforage } = await import("localforage");
        expect(localforage.setItem).toHaveBeenCalledWith(expect.any(String), file);
    });
});
