"use client";

import { useCallback, useState } from "react";

import { useDawStore } from "@/features/daw/store/dawStore";
import type { MidiClip, NoteEvent } from "@/features/daw/types/daw.types";
import { reschedule } from "../services/midiSynth";

// ── Return type ───────────────────────────────────────────────────────────────

export interface UsePianoRollReturn {
    /** ID of the currently open MIDI clip (null = no clip selected). */
    activeClipId: string | null;
    /** MidiClip for the active clip, or null if none selected. */
    activeClip: MidiClip | null;
    /** Open a MIDI clip in the editor. */
    openClip: (clipId: string) => void;
    /** Close the active clip. */
    closeClip: () => void;
    /** Add a note event to the active clip and reschedule playback. */
    addNote: (pitch: number, startBeat: number, durationBeats: number, velocity?: number) => void;
    /** Remove a note event from the active clip and reschedule playback. */
    removeNote: (noteId: string) => void;
    /** Move a note (change pitch and/or startBeat) and reschedule playback. */
    moveNote: (noteId: string, patch: { startBeat?: number; pitch?: number }) => void;
}

/**
 * Orchestrates the Piano Roll feature:
 * - Reads/writes MIDI note state via Zustand
 * - Reschedules Tone.Part on every note change
 *
 * Active clip ID is local React state (not persisted to Zustand) since
 * it is purely a UI concern — which clip is currently open in the editor.
 */
export function usePianoRoll(): UsePianoRollReturn {
    const [activeClipId, setActiveClipId] = useState<string | null>(null);

    const midiClips = useDawStore((s) => s.midiClips);
    const bpm = useDawStore((s) => s.bpm);
    const storeAddNote = useDawStore((s) => s.addNote);
    const storeRemoveNote = useDawStore((s) => s.removeNote);
    const storeMoveNote = useDawStore((s) => s.moveNote);

    const activeClip = midiClips.find((c) => c.id === activeClipId) ?? null;

    const openClip = useCallback((clipId: string) => {
        setActiveClipId(clipId);
    }, []);

    const closeClip = useCallback(() => {
        setActiveClipId(null);
    }, []);

    const addNote = useCallback(
        (pitch: number, startBeat: number, durationBeats: number, velocity = 100) => {
            if (!activeClipId) return;

            const note: NoteEvent = {
                id: crypto.randomUUID(),
                pitch,
                startBeat,
                durationBeats,
                velocity,
            };

            storeAddNote(activeClipId, note);

            // Reschedule: read fresh notes after immer mutation
            const updatedClip = useDawStore
                .getState()
                .midiClips.find((c) => c.id === activeClipId);
            if (updatedClip) {
                const trackId = updatedClip.trackId;
                reschedule(trackId, updatedClip.notes, bpm);
            }
        },
        [activeClipId, storeAddNote, bpm],
    );

    const removeNote = useCallback(
        (noteId: string) => {
            if (!activeClipId) return;

            storeRemoveNote(activeClipId, noteId);

            const updatedClip = useDawStore
                .getState()
                .midiClips.find((c) => c.id === activeClipId);
            if (updatedClip) {
                reschedule(updatedClip.trackId, updatedClip.notes, bpm);
            }
        },
        [activeClipId, storeRemoveNote, bpm],
    );

    const moveNote = useCallback(
        (noteId: string, patch: { startBeat?: number; pitch?: number }) => {
            if (!activeClipId) return;

            storeMoveNote(activeClipId, noteId, patch);

            const updatedClip = useDawStore
                .getState()
                .midiClips.find((c) => c.id === activeClipId);
            if (updatedClip) {
                reschedule(updatedClip.trackId, updatedClip.notes, bpm);
            }
        },
        [activeClipId, storeMoveNote, bpm],
    );

    return {
        activeClipId,
        activeClip,
        openClip,
        closeClip,
        addNote,
        removeNote,
        moveNote,
    };
}
