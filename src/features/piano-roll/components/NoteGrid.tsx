"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Line, Rect } from "react-konva";

import type { NoteEvent } from "@/features/daw/types/daw.types";
import type { UsePianoRollReturn } from "../hooks/usePianoRoll";
import {
    BEAT_WIDTH,
    NOTE_ROW_HEIGHT,
    PITCH_MAX,
    PITCH_MIN,
    xToBeat,
    yToPitch,
} from "../types/piano-roll.types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Total number of visible pitch rows */
const ROW_COUNT = PITCH_MAX - PITCH_MIN + 1;
/** Total number of beat columns to display */
const TOTAL_BEATS = 32;

const GRID_BG = "#111111";
const EVEN_ROW_BG = "rgba(255,255,255,0.02)";
const BLACK_KEY_ROW_BG = "rgba(0,0,0,0.15)";
const BEAT_LINE_COLOR = "rgba(255,255,255,0.10)";
const BAR_LINE_COLOR = "rgba(255,255,255,0.22)";
const NOTE_FILL = "#4ade80";
const NOTE_SELECTED_FILL = "#f472b6";

// ── Draggable Note Rect ───────────────────────────────────────────────────────
// We use dnd-kit but wrap it in a Konva Rect via the HTML pointer capture
// approach: each Rect responds to pointer down → starts a drag, on drop
// the NoteGrid calls moveNote.

interface NoteRectProps {
    note: NoteEvent;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

function NoteRect({ note, isSelected, onSelect, onDelete }: NoteRectProps) {
    const x = note.startBeat * BEAT_WIDTH;
    const y = (PITCH_MAX - note.pitch) * NOTE_ROW_HEIGHT;
    const w = note.durationBeats * BEAT_WIDTH - 1;
    const fill = isSelected ? NOTE_SELECTED_FILL : NOTE_FILL;

    return (
        <Rect
            data-testid={`note-${note.id}`}
            x={x}
            y={y}
            width={Math.max(w, 4)}
            height={NOTE_ROW_HEIGHT - 1}
            fill={fill}
            opacity={0.85}
            cornerRadius={2}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.4}
            onClick={() => onSelect(note.id)}
            onDblClick={() => onDelete(note.id)}
            onTap={() => onSelect(note.id)}
        />
    );
}

// ── NoteGrid ──────────────────────────────────────────────────────────────────

export interface NoteGridProps {
    notes: NoteEvent[];
    actions: Pick<UsePianoRollReturn, "addNote" | "removeNote" | "moveNote">;
    /** Pixel width of the grid canvas. */
    width: number;
}

/**
 * Konva Layer for the 2D MIDI note grid.
 *
 * - Horizontal row lines (one per semitone).
 * - Vertical beat + bar-line grid.
 * - `NoteRect` per `NoteEvent` with click-to-select, double-click-to-delete.
 * - Click on grid background → `addNote` at snapped beat/pitch.
 *
 * Rule 1 compliant — no direct audio imports.
 */
export function NoteGrid({ notes, actions, width }: NoteGridProps) {
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    const handleLayerClick = (e: KonvaEventObject<MouseEvent>) => {
        // Only handle clicks on the background, not on note rects
        if ((e.target as Konva.Node).name() === "note-rect") return;

        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;

        const beat = xToBeat(pos.x);
        const pitch = yToPitch(pos.y);

        // Clamp pitch to visible range
        if (pitch < PITCH_MIN || pitch > PITCH_MAX) return;

        actions.addNote(pitch, beat, 1); // default 1-beat duration
        setSelectedId(null);
    };

    const handleSelect = (id: string) => setSelectedId((prev) => (prev === id ? null : id));

    const handleDelete = (id: string) => {
        actions.removeNote(id);
        if (selectedId === id) setSelectedId(null);
    };

    const gridHeight = ROW_COUNT * NOTE_ROW_HEIGHT;

    return (
        <Layer onClick={handleLayerClick}>
            {/* ── Background fill ─────────────────────────────────────────────── */}
            <Rect x={0} y={0} width={width} height={gridHeight} fill={GRID_BG} listening={false} />

            {/* ── Row backgrounds (black-key rows are darker) ─────────────────── */}
            {Array.from({ length: ROW_COUNT }, (_, rowIdx) => {
                const pitch = PITCH_MAX - rowIdx;
                const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);
                return (
                    <Rect
                        key={`row-bg-${pitch}`}
                        x={0}
                        y={rowIdx * NOTE_ROW_HEIGHT}
                        width={width}
                        height={NOTE_ROW_HEIGHT}
                        fill={isBlack ? BLACK_KEY_ROW_BG : EVEN_ROW_BG}
                        listening={false}
                    />
                );
            })}

            {/* ── Horizontal row lines ─────────────────────────────────────────── */}
            {Array.from({ length: ROW_COUNT + 1 }, (_, i) => (
                <Line
                    key={`hline-${i}`}
                    points={[0, i * NOTE_ROW_HEIGHT, width, i * NOTE_ROW_HEIGHT]}
                    stroke={BEAT_LINE_COLOR}
                    strokeWidth={0.5}
                    listening={false}
                />
            ))}

            {/* ── Vertical beat + bar lines ────────────────────────────────────── */}
            {Array.from({ length: TOTAL_BEATS + 1 }, (_, beat) => (
                <Line
                    key={`vline-${beat}`}
                    points={[beat * BEAT_WIDTH, 0, beat * BEAT_WIDTH, gridHeight]}
                    stroke={beat % 4 === 0 ? BAR_LINE_COLOR : BEAT_LINE_COLOR}
                    strokeWidth={beat % 4 === 0 ? 1 : 0.5}
                    listening={false}
                />
            ))}

            {/* ── Note rects ──────────────────────────────────────────────────── */}
            {notes.map((note) => (
                <NoteRect
                    key={note.id}
                    note={note}
                    isSelected={selectedId === note.id}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                />
            ))}
        </Layer>
    );
}

// React must be in scope for JSX in this file
import React from "react";
