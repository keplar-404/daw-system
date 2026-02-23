"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useDraggable } from "@dnd-kit/core";
import { useTimelineStore } from "@/features/timeline-ruler/store/timelineStore";
import { AudioBlock } from "@/features/core-audio/types/audio";
import { cn } from "@/lib/utils";
import { AudioEngine } from "@/features/core-audio/lib/audio-engine";
import { useTrackStore } from "@/features/track-manager/store/trackStore";
import { useAudioStore } from "@/features/core-audio/store/audioStore";

interface AudioClipProps {
    block: AudioBlock;
    color: string;
}

export function AudioClip({ block, color }: AudioClipProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const { pixelsPerSecond } = useTimelineStore();
    const [isLoaded, setIsLoaded] = useState(false);

    const { updateBlock } = useTrackStore();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: {
            block,
        },
    });

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: `${color}cc`,
            progressColor: color,
            cursorColor: "transparent",
            barWidth: 2,
            barGap: 1,
            height: 60,
            normalize: true,
            interact: false, // Timeline handles seeking
        });

        ws.load(block.blobUrl);

        ws.on("ready", () => {
            setIsLoaded(true);
            // Sync with AudioEngine playback scheduling
            AudioEngine.getInstance()?.scheduleBlock(block.trackId, block);
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
            AudioEngine.getInstance()?.unscheduleBlock(block.id);
        };
    }, [block.blobUrl, block.id, block.trackId, color]);

    // Update scheduling if block parameters change (startTime, offset, duration)
    useEffect(() => {
        if (isLoaded) {
            AudioEngine.getInstance()?.scheduleBlock(block.trackId, block);
        }
    }, [block.startTime, block.offset, block.duration, isLoaded, block.trackId]);

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        width: Math.max(10, block.duration * pixelsPerSecond),
        left: block.startTime * pixelsPerSecond,
    } : {
        width: Math.max(10, block.duration * pixelsPerSecond),
        left: block.startTime * pixelsPerSecond,
    };

    // Split logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 's' && !isDragging) {
                // Find if mouse is over this clip (this is a bit tricky without a portal or ref-based mouse tracking)
                // For simplicity, we can use a local 'isHovered' state
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDragging]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            onKeyDown={(e) => {
                if (e.key.toLowerCase() === 's') {
                    const { playheadPosition } = useAudioStore.getState();
                    const splitPoint = playheadPosition;

                    if (splitPoint > block.startTime && splitPoint < block.startTime + block.duration) {
                        const splitOffset = splitPoint - block.startTime;
                        const originalClipDuration = block.duration;

                        // 1. Update current block (left part)
                        updateBlock(block.trackId, block.id, {
                            duration: splitOffset
                        });

                        // 2. Create new block (right part)
                        const newBlockId = Math.random().toString(36).substring(7);
                        const newBlock: AudioBlock = {
                            ...block,
                            id: newBlockId,
                            startTime: splitPoint,
                            offset: block.offset + splitOffset,
                            duration: originalClipDuration - splitOffset,
                            name: `${block.name} (Copy)`
                        };

                        useTrackStore.getState().addBlock(block.trackId, newBlock);
                    }
                }
            }}
            className={cn(
                "absolute top-2 bottom-2 rounded-md border border-white/10 bg-white/5 overflow-hidden group cursor-grab active:cursor-grabbing z-20 transition-shadow focus:outline-none focus:ring-1 focus:ring-primary/50",
                isDragging && "opacity-50 shadow-2xl ring-2 ring-primary border-primary",
                !isLoaded && "animate-pulse"
            )}
            {...listeners}
            {...attributes}
        >
            <div ref={containerRef} className="w-full h-full pointer-events-none" />

            {/* Overlay info */}
            <div className="absolute top-1 left-2 flex flex-col pointer-events-none">
                <span className="text-[10px] font-bold text-white/70 truncate drop-shadow-md">
                    {block.name}
                </span>
            </div>

            {/* Trimming Handles */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/30 cursor-ew-resize z-30 flex items-center justify-center group/left"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startStartTime = block.startTime;
                    const startOffset = block.offset;
                    const startDuration = block.duration;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = (moveEvent.clientX - startX) / pixelsPerSecond;
                        const newStartTime = Math.max(0, startStartTime + deltaX);
                        const actualDelta = newStartTime - startStartTime;
                        const newOffset = Math.max(0, startOffset + actualDelta);
                        const newDuration = Math.max(0.1, startDuration - actualDelta);

                        updateBlock(block.trackId, block.id, {
                            startTime: newStartTime,
                            offset: newOffset,
                            duration: newDuration
                        });
                    };

                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }}
            >
                <div className="w-px h-4 bg-white/20 group-hover/left:bg-white/50" />
            </div>

            <div
                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/30 cursor-ew-resize z-30 flex items-center justify-center group/right"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startDuration = block.duration;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = (moveEvent.clientX - startX) / pixelsPerSecond;
                        const newDuration = Math.max(0.1, startDuration + deltaX);
                        updateBlock(block.trackId, block.id, { duration: newDuration });
                    };

                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }}
            >
                <div className="w-px h-4 bg-white/20 group-hover/right:bg-white/50" />
            </div>
        </div>
    );
}
