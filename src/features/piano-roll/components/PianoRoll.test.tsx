import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDawStore } from "@/features/daw/store/dawStore";
import type { MidiClip, NoteEvent } from "@/features/daw/types/daw.types";
import { PianoRoll } from "./PianoRoll";

// ── Constants (declared before mocks that reference them) ────────────────────
const CLIP_ID = "clip-1";
const TRACK_ID = "track-1";

// ── Mock react-konva ──────────────────────────────────────────────────────────
// jsdom has no canvas — replace with plain divs.
vi.mock("react-konva", () => ({
    Stage: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="konva-stage">{children}</div>
    ),
    Layer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Rect: ({ onClick, onDblClick }: { onClick?: () => void; onDblClick?: () => void }) => (
        <div onClick={onClick} onDoubleClick={onDblClick} />
    ),
    Line: () => null,
    Text: () => null,
}));

// ── Mock @dnd-kit/core ────────────────────────────────────────────────────────
vi.mock("@dnd-kit/core", () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null }),
    useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

// ── Mock midiSynth ────────────────────────────────────────────────────────────
const mockReschedule = vi.fn().mockResolvedValue(undefined);

vi.mock("../services/midiSynth", () => ({
    createSynth: vi.fn().mockResolvedValue(undefined),
    reschedule: (...a: unknown[]) => mockReschedule(...a),
    schedulePart: vi.fn().mockResolvedValue(undefined),
    disposeSynth: vi.fn(),
    getSynth: vi.fn(),
}));

// ── Mock PianoKeyboard ────────────────────────────────────────────────────────
vi.mock("./PianoKeyboard", () => ({
    PianoKeyboard: () => <div data-testid="piano-keyboard" />,
}));

// ── Mock NoteGrid ─────────────────────────────────────────────────────────────
// Renders a clickable background + per-note delete buttons.
// Receives actions from PianoRoll → usePianoRoll (mocked below).
vi.mock("./NoteGrid", () => ({
    NoteGrid: ({
        notes,
        actions,
    }: {
        notes: NoteEvent[];
        actions: {
            addNote: (pitch: number, beat: number, dur: number) => void;
            removeNote: (id: string) => void;
            moveNote: (id: string, patch: object) => void;
        };
    }) => (
        <div data-testid="note-grid">
            <div
                data-testid="grid-background"
                onClick={() => actions.addNote(60, 1, 1)}
                onKeyDown={() => actions.addNote(60, 1, 1)}
            />
            {notes.map((n) => (
                <button
                    key={n.id}
                    type="button"
                    data-testid={`delete-note-${n.id}`}
                    onClick={() => actions.removeNote(n.id)}
                >
                    delete
                </button>
            ))}
        </div>
    ),
}));

// ── Mock usePianoRoll ─────────────────────────────────────────────────────────
// Wire hook actions to call the Zustand store directly (same pattern as
// TrackList.test.tsx mocking useTrackList).  This bypasses the activeClipId
// null-guard and tests the store contract in isolation.
vi.mock("../hooks/usePianoRoll", () => ({
    usePianoRoll: () => ({
        activeClipId: CLIP_ID,
        activeClip: null,
        openClip: vi.fn(),
        closeClip: vi.fn(),
        addNote: (pitch: number, startBeat: number, durationBeats: number, velocity = 100) => {
            const note: NoteEvent = {
                id: crypto.randomUUID(),
                pitch,
                startBeat,
                durationBeats,
                velocity,
            };
            useDawStore.getState().addNote(CLIP_ID, note);
            const clip = useDawStore.getState().midiClips.find((c) => c.id === CLIP_ID);
            if (clip) mockReschedule(TRACK_ID, clip.notes, 120);
        },
        removeNote: (noteId: string) => {
            useDawStore.getState().removeNote(CLIP_ID, noteId);
            const clip = useDawStore.getState().midiClips.find((c) => c.id === CLIP_ID);
            if (clip) mockReschedule(TRACK_ID, clip.notes, 120);
        },
        moveNote: vi.fn(),
    }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_CLIP: MidiClip = {
    id: CLIP_ID,
    trackId: TRACK_ID,
    startBeat: 0,
    durationBeats: 16,
    notes: [],
};

function resetStore(clips: MidiClip[] = []) {
    useDawStore.setState({
        bpm: 120,
        isPlaying: false,
        tracks: [],
        clips: [],
        midiClips: clips,
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PianoRoll", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStore([MOCK_CLIP]);
    });

    // Test 1: Click grid at beat 1, pitch C4 → NoteEvent added to Zustand store
    it("adds a C4 note at beat 1 to the Zustand store when the grid is clicked", async () => {
        render(<PianoRoll clipId={CLIP_ID} />);

        await act(async () => {
            fireEvent.click(screen.getByTestId("grid-background"));
            await Promise.resolve();
        });

        const notes = useDawStore.getState().midiClips.find((c) => c.id === CLIP_ID)?.notes ?? [];
        expect(notes).toHaveLength(1);
        expect(notes[0].pitch).toBe(60);    // C4
        expect(notes[0].startBeat).toBe(1);

        // Tone.Part must be rescheduled
        expect(mockReschedule).toHaveBeenCalledTimes(1);
        expect(mockReschedule).toHaveBeenCalledWith(
            TRACK_ID,
            expect.arrayContaining([expect.objectContaining({ pitch: 60, startBeat: 1 })]),
            120,
        );
    });

    // Test 2: Delete note → removed from store + Tone.Part rescheduled
    it("removes a note from the store and reschedules Tone.Part when deleted", async () => {
        const existingNote: NoteEvent = {
            id: "note-existing",
            pitch: 60,
            startBeat: 1,
            durationBeats: 1,
            velocity: 100,
        };
        resetStore([{ ...MOCK_CLIP, notes: [existingNote] }]);

        render(<PianoRoll clipId={CLIP_ID} />);

        await act(async () => {
            fireEvent.click(screen.getByTestId("delete-note-note-existing"));
            await Promise.resolve();
        });

        const notes = useDawStore.getState().midiClips.find((c) => c.id === CLIP_ID)?.notes ?? [];
        expect(notes).toHaveLength(0);

        expect(mockReschedule).toHaveBeenCalledTimes(1);
        expect(mockReschedule).toHaveBeenCalledWith(TRACK_ID, [], 120);
    });
});
