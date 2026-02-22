"use client";

import { memo } from "react";

interface TimelineRulerProps {
    virtualMeasures: Array<{ index: number; start: number }>;
    pxPerBeat: number;
    beatsPerMeasure: number;
    scrollLeft: number;
}

/**
 * Visual DOM-based ruler for the timeline.
 * Renders measure numbers and thin beat ticks aligned perfectly with the Konva stage grid beneath it.
 */
export const TimelineRuler = memo(function TimelineRuler({
    virtualMeasures,
    pxPerBeat,
    beatsPerMeasure,
    scrollLeft,
}: TimelineRulerProps) {
    return (
        <div className="sticky top-0 z-20 h-8 w-full border-b border-border bg-background backdrop-blur-md relative overflow-hidden pointer-events-none">
            {virtualMeasures.map(({ index, start }) => {
                // Adjust for current scroll position
                const x = start - scrollLeft;

                return (
                    <div
                        key={`measure-${index}`}
                        className="absolute top-0 h-full border-l border-border/80 flex items-start"
                        style={{ left: x, width: pxPerBeat * beatsPerMeasure }}
                    >
                        {/* Measure Number Label */}
                        <span className="px-1 text-[10px] font-mono font-medium text-muted-foreground select-none">
                            {index + 1}
                        </span>

                        {/* Inner beat ticks */}
                        {Array.from({ length: beatsPerMeasure - 1 }).map((_, b) => (
                            <div
                                key={`tick-${index}-${b}`}
                                className="absolute bottom-0 w-px bg-border/40"
                                style={{
                                    left: (b + 1) * pxPerBeat,
                                    height: "40%", // Ticks only come up partway
                                }}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
});
