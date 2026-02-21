"use client";

import React from "react";
import { useProjectStore } from "@/features/project/project-store";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Mixer panel (placeholder — to be replaced by dedicated Mixer feature)
// ---------------------------------------------------------------------------

export function MixerPanel(): React.ReactElement {
    const tracks = useProjectStore((s) => s.activeProject?.tracks) ?? [];
    const toggleMixer = useUIStore((s) => s.toggleMixer);

    return (
        <div
            className="h-[220px] border-t shrink-0 flex overflow-hidden z-20 bg-card"
            role="complementary"
            aria-label="Mixer panel"
        >
            {/* Mixer header */}
            <div className="w-full flex flex-col h-full">
                <div className="flex items-center h-8 px-3 border-b bg-muted/20 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Mixer
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-muted-foreground hover:text-foreground"
                        aria-label="Collapse mixer"
                        onClick={toggleMixer}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>

                {/* Channel strips */}
                <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
                    {tracks.map((track) => (
                        <MixerChannel key={track.id} track={track} />
                    ))}
                    {tracks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                            No tracks
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Minimal mixer channel strip */
const MixerChannel = React.memo(function MixerChannel({
    track,
}: {
    track: import("@/types/project").Track;
}): React.ReactElement {
    const updateTrack = useProjectStore((s) => s.updateTrack);
    const selectedTrackId = useUIStore((s) => s.selectedTrackId);
    const selectTrack = useUIStore((s) => s.selectTrack);

    const isSelected = track.id === selectedTrackId;

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Mixer channel: ${track.name}`}
            aria-selected={isSelected}
            onClick={() => selectTrack(track.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") selectTrack(track.id);
            }}
            className={`
        w-20 border-r flex flex-col items-center py-2 gap-1.5 relative
        cursor-pointer transition-colors shrink-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring
        ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}
      `}
        >
            {/* Active track indicator */}
            {isSelected && (
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: track.color }}
                    aria-hidden="true"
                />
            )}

            {/* Volume fader (visual only — uses div instead of shadcn Slider to avoid orientation issue) */}
            <div className="flex-1 flex items-center justify-center w-full px-3">
                <div
                    className="relative w-2 bg-muted/40 rounded-full"
                    style={{ height: 80 }}
                    role="slider"
                    aria-label={`Volume for ${track.name}`}
                    aria-valuenow={Math.round(track.volume * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    tabIndex={0}
                >
                    <div
                        className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                        style={{
                            height: `${track.volume * 100}%`,
                            backgroundColor: track.color,
                            opacity: track.muted ? 0.3 : 0.7,
                        }}
                    />
                    <div
                        className="absolute left-1/2 -translate-x-1/2 w-5 h-2 bg-foreground/80 rounded-sm cursor-ns-resize shadow-md"
                        style={{ bottom: `calc(${track.volume * 100}% - 4px)` }}
                        onPointerDown={(e) => {
                            const el = e.currentTarget.parentElement;
                            if (!el) return;
                            e.currentTarget.setPointerCapture(e.pointerId);
                            const startY = e.clientY;
                            const startVol = track.volume;
                            const rect = el.getBoundingClientRect();

                            const onMove = (me: PointerEvent) => {
                                const dy = startY - me.clientY;
                                const delta = dy / rect.height;
                                const next = Math.max(0, Math.min(1, startVol + delta));
                                updateTrack(track.id, { volume: next });
                            };

                            const onUp = () => {
                                window.removeEventListener("pointermove", onMove);
                                window.removeEventListener("pointerup", onUp);
                            };
                            window.addEventListener("pointermove", onMove);
                            window.addEventListener("pointerup", onUp);
                        }}
                    />
                </div>
            </div>

            {/* M / S buttons */}
            <div className="flex gap-1">
                <button
                    type="button"
                    aria-label={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
                    aria-pressed={track.muted}
                    onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { muted: !track.muted });
                    }}
                    className={`w-7 h-7 rounded text-xs font-bold border cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-ring ${track.muted
                        ? "bg-chart-5/20 text-chart-5 border-chart-5/50"
                        : "border-white/10 text-white/30 hover:text-white/60"
                        }`}
                >
                    M
                </button>
                <button
                    type="button"
                    aria-label={track.soloed ? `Unsolo ${track.name}` : `Solo ${track.name}`}
                    aria-pressed={track.soloed}
                    onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { soloed: !track.soloed });
                    }}
                    className={`w-7 h-7 rounded text-xs font-bold border cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-ring ${track.soloed
                        ? "bg-chart-3/20 text-chart-3 border-chart-3/50"
                        : "border-white/10 text-white/30 hover:text-white/60"
                        }`}
                >
                    S
                </button>
            </div>

            {/* Channel name */}
            <div className="w-full text-center px-1">
                <span
                    className="text-[9px] font-semibold truncate block leading-none"
                    style={{ color: track.color }}
                    title={track.name}
                >
                    {track.name}
                </span>
                <span className="text-[8px] text-muted-foreground font-mono leading-none">
                    {(20 * Math.log10(Math.max(track.volume, 0.001))).toFixed(1)}dB
                </span>
            </div>
        </div>
    );
});
