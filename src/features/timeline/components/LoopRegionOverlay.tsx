"use client";

import { memo } from "react";
import { Rnd } from "react-rnd";
import { useDawStore } from "@/features/daw/store/dawStore";

interface LoopRegionOverlayProps {
    pxPerBeat: number;
    height: number;
}

/**
 * Semi-transparent draggable loop region overlapping the timeline tracks.
 */
export const LoopRegionOverlay = memo(function LoopRegionOverlay({
    pxPerBeat,
    height,
}: LoopRegionOverlayProps) {
    // 1. Pull Loop states
    const isLooping = useDawStore((s) => s.isLooping);
    const loopStart = useDawStore((s) => s.loopStart);
    const loopEnd = useDawStore((s) => s.loopEnd);

    // 2. Pull action mutators
    const setLoopStart = useDawStore((s) => s.setLoopStart);
    const setLoopEnd = useDawStore((s) => s.setLoopEnd);

    // If looping is disabled globally (optional UX choice), we might hide it, 
    // but for now let's always show the loop region boundaries so users can edit them before toggling.

    // ── Sync Visuals ───────────────────────────────────────────────────────────
    const x = loopStart * pxPerBeat;
    const width = (loopEnd - loopStart) * pxPerBeat;

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleDragStop = (e: any, d: any) => {
        // Determine new start beat from X position
        const newStartBeat = Math.max(0, d.x / pxPerBeat);
        const duration = loopEnd - loopStart; // keep same length

        // Dispatch
        setLoopStart(newStartBeat);
        setLoopEnd(newStartBeat + duration);
    };

    const handleResizeStop = (
        e: any,
        direction: any,
        ref: HTMLElement,
        delta: any,
        position: { x: number; y: number }
    ) => {
        const newWidthPx = ref.offsetWidth;
        const newStartBeat = Math.max(0, position.x / pxPerBeat);
        const newDurationBeats = Math.max(1, newWidthPx / pxPerBeat); // Minimum 1 beat loop length

        setLoopStart(newStartBeat);
        setLoopEnd(newStartBeat + newDurationBeats);
    };

    return (
        <Rnd
            size={{ width, height }}
            position={{ x, y: 0 }}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            dragAxis="x"
            bounds="parent"
            enableResizing={{
                left: true,
                right: true,
                top: false,
                bottom: false,
                topLeft: false,
                topRight: false,
                bottomLeft: false,
                bottomRight: false,
            }}
            className={`
        absolute top-0 z-30 group
        border-x-2 border-blue-500
        transition-opacity duration-200
        ${isLooping ? "opacity-100" : "opacity-40 grayscale"}
      `}
            // Let children blocks catch pointers for Resize/Drag logic explicitly, 
            // but bypass the massive generic body so the user can interact with AudioClips beneath it.
            style={{ pointerEvents: "none" }}
        >
            {/* ── Background Tint ──── */}
            <div className="absolute inset-0 w-full h-full bg-blue-500/10 pointer-events-none" />

            {/* ── Drag Header Handle ──── */}
            {/* Re-enable pointer events up here so the user can drag the entire block left/right */}
            <div
                className="absolute top-0 left-0 w-full h-8 cursor-grab active:cursor-grabbing bg-blue-500/20 hover:bg-blue-500/40 pointer-events-auto transition-colors flex items-center justify-center"
            >
                <div className="w-8 h-1 rounded-full bg-white/40" />
            </div>

            {/* ── Resize Handles ──── */}
            <div className="absolute top-0 -left-1 w-2 h-full cursor-col-resize pointer-events-auto bg-blue-500/0 hover:bg-blue-500/50 transition-colors" />
            <div className="absolute top-0 -right-1 w-2 h-full cursor-col-resize pointer-events-auto bg-blue-500/0 hover:bg-blue-500/50 transition-colors" />
        </Rnd>
    );
});
