"use client";

import React, { useCallback } from "react";
import { useProjectStore } from "@/features/project/project-store";
import { useUIStore, TRACK_HEADER_WIDTH } from "@/store/uiStore";
import { TrackHeader } from "@/components/daw/track-header";

interface TrackHeaderListProps {
    trackHeight: number;
    scrollY: number;
    containerHeight: number;
}

/**
 * Renders only the track headers currently visible in the vertical viewport.
 * Absolute positioning keeps DOM node count bounded regardless of project size.
 */
export const TrackHeaderList = React.memo(function TrackHeaderList({
    trackHeight,
    scrollY,
    containerHeight,
}: TrackHeaderListProps): React.ReactElement {
    const tracks = useProjectStore((s) => s.activeProject?.tracks) ?? [];
    const selectedTrackId = useUIStore((s) => s.selectedTrackId);
    const selectTrack = useUIStore((s) => s.selectTrack);
    const updateTrack = useProjectStore((s) => s.updateTrack);

    const totalHeight = tracks.length * trackHeight;

    // Visible index range
    const firstIdx = Math.max(0, Math.floor(scrollY / trackHeight) - 1);
    const lastIdx = Math.min(
        tracks.length - 1,
        Math.ceil((scrollY + containerHeight) / trackHeight) + 1
    );

    const handleMute = useCallback(
        (id: string) => {
            const track = tracks.find((t) => t.id === id);
            if (track) updateTrack(id, { muted: !track.muted });
        },
        [tracks, updateTrack]
    );

    const handleSolo = useCallback(
        (id: string) => {
            const track = tracks.find((t) => t.id === id);
            if (track) updateTrack(id, { soloed: !track.soloed });
        },
        [tracks, updateTrack]
    );

    const handleArm = useCallback(
        (id: string) => {
            const track = tracks.find((t) => t.id === id);
            if (track) updateTrack(id, { armed: !track.armed });
        },
        [tracks, updateTrack]
    );

    return (
        <div
            className="relative overflow-hidden w-full h-full"
            aria-label="Track list"
            role="list"
        >
            {/* Scrollable inner — absolute so we only render visible tracks */}
            <div style={{ position: "relative", height: totalHeight }}>
                {tracks.slice(firstIdx, lastIdx + 1).map((track, relIdx) => {
                    const absIdx = firstIdx + relIdx;
                    const top = absIdx * trackHeight - scrollY;
                    return (
                        <div
                            key={track.id}
                            role="listitem"
                            style={{
                                position: "absolute",
                                top,
                                left: 0,
                                right: 0,
                            }}
                        >
                            <TrackHeader
                                track={track}
                                height={trackHeight}
                                isSelected={track.id === selectedTrackId}
                                onSelect={selectTrack}
                                onMuteToggle={handleMute}
                                onSoloToggle={handleSolo}
                                onArmToggle={handleArm}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
