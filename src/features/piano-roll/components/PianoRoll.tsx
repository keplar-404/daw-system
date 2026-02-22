"use client";

import { DndContext } from "@dnd-kit/core";
import { useRef, useState } from "react";
import { Stage } from "react-konva";

import { useDawStore } from "@/features/daw/store/dawStore";
import { usePianoRoll } from "../hooks/usePianoRoll";
import {
    BEAT_WIDTH,
    KEYBOARD_WIDTH,
    NOTE_ROW_HEIGHT,
    PITCH_MAX,
    PITCH_MIN,
} from "../types/piano-roll.types";
import { NoteGrid } from "./NoteGrid";
import { PianoKeyboard } from "./PianoKeyboard";

const VISIBLE_BEATS = 32;
const ROW_COUNT = PITCH_MAX - PITCH_MIN + 1;
const GRID_HEIGHT = ROW_COUNT * NOTE_ROW_HEIGHT;
const GRID_WIDTH = VISIBLE_BEATS * BEAT_WIDTH;

interface PianoRollProps {
    /** ID of the MIDI clip to display. If null, shows empty state. */
    clipId: string | null;
}

/**
 * Piano Roll editor — full Konva canvas combining PianoKeyboard + NoteGrid.
 *
 * Layout (horizontal Konva Stage):
 *   ┌────────────┬──────────────────────────────────────────┐
 *   │ PianoKeyboard (48px) │ NoteGrid (scroll → BEAT_WIDTH × beats) │
 *   └────────────┴──────────────────────────────────────────┘
 *
 * Wrapped in DndContext so NoteGrid's future drag-to-move works out of the box.
 * Rule 1 compliant — no direct audio imports.
 */
export function PianoRoll({ clipId }: PianoRollProps) {
    const midiClips = useDawStore((s) => s.midiClips);
    const clip = midiClips.find((c) => c.id === clipId) ?? null;

    const { addNote, removeNote, moveNote } = usePianoRoll();

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollLeft, setScrollLeft] = useState(0);

    if (!clip) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-zinc-950">
                <p className="text-xs text-muted-foreground">
                    Select a MIDI clip from the timeline to edit notes
                </p>
            </div>
        );
    }

    const noteActions = { addNote, removeNote, moveNote };

    return (
        <DndContext>
            <div
                ref={containerRef}
                className="flex h-full w-full overflow-hidden bg-zinc-950"
                data-testid="piano-roll"
            >
                {/* Scrollable grid wrapper */}
                <div className="relative flex h-full w-full overflow-x-auto overflow-y-auto">
                    {/* Sticky keyboard column */}
                    <div
                        className="sticky left-0 z-10 shrink-0"
                        style={{ width: KEYBOARD_WIDTH, height: GRID_HEIGHT }}
                    >
                        <Stage width={KEYBOARD_WIDTH} height={GRID_HEIGHT}>
                            <PianoKeyboard height={GRID_HEIGHT} />
                        </Stage>
                    </div>

                    {/* Scrollable note grid */}
                    <div style={{ width: GRID_WIDTH, height: GRID_HEIGHT, flexShrink: 0 }}>
                        <Stage
                            width={GRID_WIDTH}
                            height={GRID_HEIGHT}
                            data-testid="note-grid-stage"
                        >
                            <NoteGrid
                                notes={clip.notes}
                                actions={noteActions}
                                width={GRID_WIDTH}
                            />
                        </Stage>
                    </div>
                </div>
            </div>
        </DndContext>
    );
}
