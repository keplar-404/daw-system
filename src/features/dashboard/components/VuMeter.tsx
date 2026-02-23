"use client";

import { useVuMeter } from "@/features/core-audio/hooks/use-vu-meter";
import { cn } from "@/lib/utils";

export function VuMeter() {
    const [left, right] = useVuMeter();

    // Scale levels for visualization (Tone.analyser.getValue() returns values around 0-1)
    // Higher sensitivity for visualization
    const leftHeight = Math.min(100, left * 500);
    const rightHeight = Math.min(100, right * 450); // slight offset for visual variety

    return (
        <div className="flex items-end gap-[2px] h-[22px] px-1">
            <VuBar level={leftHeight} />
            <VuBar level={rightHeight} />
        </div>
    );
}

function VuBar({ level }: { level: number }) {
    const height = `${Math.max(2, level)}%`;

    // Color logic based on peak
    let bgColor = "bg-green-500";
    if (level > 80) bgColor = "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]";
    else if (level > 60) bgColor = "bg-amber-500";

    return (
        <div className="w-[5px] bg-[#1a1a28] rounded-sm overflow-hidden h-full flex items-end">
            <div
                className={cn("w-full transition-all duration-75 ease-out", bgColor)}
                style={{ height }}
            />
        </div>
    );
}
