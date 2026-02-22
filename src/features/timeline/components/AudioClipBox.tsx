"use client";

import { memo, useState } from "react";
import { Rnd } from "react-rnd";

import type { Clip } from "@/features/daw/types/daw.types";
import { WaveformOverlay } from "./WaveformOverlay";

interface AudioClipBoxProps {
    clip: Clip;
    pxPerBeat: number;
    trackIndex: number;
    trackHeight: number;
    onUpdateBounds: (
        id: string,
        patch: { startBeat?: number; durationBeats?: number }
    ) => void;
}

/**
 * Visual slice of audio mapped onto the Timeline Canvas grid.
 * Uses react-rnd to provide native desktop-grade physical resizing/dragging without
 * fighting the underlying Konva stage.
 * 
 * Absolutely positioned relative to the Timeline grid scroll content.
 */
export const AudioClipBox = memo(function AudioClipBox({
    clip,
    pxPerBeat,
    trackIndex,
    trackHeight,
    onUpdateBounds,
}: AudioClipBoxProps) {
    const [isDragging, setIsDragging] = useState(false);

    // ── Sync Visuals ───────────────────────────────────────────────────────────
    // Convert logical store beats → pixel bounds
    const x = clip.startBeat * pxPerBeat;
    const width = clip.durationBeats * pxPerBeat;

    // Track offset is calculated linearly, aligning tightly with the left sidebar rows (e.g. 96px).
    const y = trackIndex * trackHeight;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleDragStart = (e: any, d: any) => {
        setIsDragging(true);
    };

    const handleDragStop = (e: any, d: any) => {
        setIsDragging(false);

        // Convert new raw pixel `x` coordinate back to a beat
        const newStartBeat = Math.max(0, d.x / pxPerBeat);

        // Dispatch if practically altered
        if (newStartBeat !== clip.startBeat) {
            onUpdateBounds(clip.id, { startBeat: newStartBeat });
        }
    };

    const handleResizeStop = (
        e: any,
        direction: any,
        ref: HTMLElement,
        delta: any,
        position: { x: number; y: number }
    ) => {
        // Both edges could scale (if Left edge pulled, width + x change simultaneously)
        const newWidthPx = ref.offsetWidth;
        const newStartBeat = Math.max(0, position.x / pxPerBeat);
        const newDurationBeats = Math.max(1, newWidthPx / pxPerBeat); // Minimum 1 beat width

        onUpdateBounds(clip.id, {
            startBeat: newStartBeat,
            durationBeats: newDurationBeats,
        });
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Rnd
            size={{ width, height: trackHeight - 2 }} // -2 for tiny visual spacing between tracks
            position={{ x, y: y + 1 }}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            dragAxis="x" // Allow horizontal scrubbing, prevent vertical inter-track swapping (for MVP)
            bounds="parent" // Lock securely within the scrollable track width
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
        group relative rounded-md border text-xs shadow-sm shadow-black/20
        transition-[opacity,filter] overflow-hidden
        ${isDragging ? "opacity-70 z-50 brightness-110" : "opacity-100 z-10 hover:brightness-110 hover:z-20"}
        border-primary/50 bg-primary/20
      `}
        >
            {/* ── Visual Label ──── */}
            <div className="absolute top-0 left-0 w-full truncate px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground/90 bg-gradient-to-b from-black/40 to-transparent z-10 select-none pointer-events-none">
                {clip.name || "Audio Track"}
            </div>

            {/* ── Render Audio Graph Underneath ──── */}
            {clip.audioUrl && <WaveformOverlay blobId={clip.audioUrl} />}

            {/* Resize handles visuals (tailwind group hover styling) */}
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize pointer-events-none" />
            <div className="absolute top-0 right-0 w-1 h-full bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize pointer-events-none" />
        </Rnd>
    );
});
