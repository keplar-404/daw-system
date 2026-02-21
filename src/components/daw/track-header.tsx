"use client";

/**
 * @file TrackHeader.tsx
 * @description Frozen left-panel track header component.
 *
 * Displays track name, type badge, and M/S/R controls.
 * Receives all data via props — no direct store access.
 * Virtualized by the parent; only visible headers are mounted.
 *
 * Accessibility:
 * - All buttons have aria-label
 * - Keyboard navigable (Tab order maintained)
 * - Color is never the sole indicator of state
 */

import React, { useCallback } from "react";
import type { Track } from "@/types/project";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackHeaderProps {
    track: Track;
    height: number;
    isSelected: boolean;
    onSelect: (trackId: string) => void;
    onMuteToggle: (trackId: string) => void;
    onSoloToggle: (trackId: string) => void;
    onArmToggle: (trackId: string) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Small M/S/R toggle button */
const ControlButton = React.memo(function ControlButton({
    label,
    ariaLabel,
    active,
    activeClass,
    onClick,
}: {
    label: string;
    ariaLabel: string;
    active: boolean;
    activeClass: string;
    onClick: () => void;
}): React.ReactElement {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            aria-pressed={active}
            onClick={onClick}
            className={`
        flex items-center justify-center
        w-7 h-7 rounded text-xs font-bold
        border transition-colors cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${active ? activeClass : "border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 bg-transparent"}
      `}
        >
            {label}
        </button>
    );
});

// ---------------------------------------------------------------------------
// Track badge
// ---------------------------------------------------------------------------

const TYPE_BADGE: Record<Track["type"], { label: string; cls: string }> = {
    midi: {
        label: "MIDI",
        cls: "bg-primary/20 text-primary border-primary/30",
    },
    audio: {
        label: "AUDIO",
        cls: "bg-destructive/20 text-destructive border-destructive/30",
    },
    bus: {
        label: "BUS",
        cls: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    },
    master: {
        label: "MASTER",
        cls: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * TrackHeader
 *
 * Frozen left-side panel row for a single track.
 * Height must match the Pixi canvas track lane height exactly.
 */
export const TrackHeader = React.memo(function TrackHeader({
    track,
    height,
    isSelected,
    onSelect,
    onMuteToggle,
    onSoloToggle,
    onArmToggle,
}: TrackHeaderProps): React.ReactElement {
    const handleClick = useCallback(() => onSelect(track.id), [onSelect, track.id]);
    const handleMute = useCallback(() => onMuteToggle(track.id), [onMuteToggle, track.id]);
    const handleSolo = useCallback(() => onSoloToggle(track.id), [onSoloToggle, track.id]);
    const handleArm = useCallback(() => onArmToggle(track.id), [onArmToggle, track.id]);

    const badge = TYPE_BADGE[track.type] ?? TYPE_BADGE.audio;

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Track: ${track.name}`}
            aria-selected={isSelected}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                }
            }}
            className={`
        flex flex-col justify-between px-3 py-2
        border-b border-r cursor-pointer
        transition-colors shrink-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring
        ${isSelected
                    ? "bg-primary/8 border-l-2"
                    : "bg-card border-l-2 border-l-transparent hover:bg-muted/30"
                }
      `}
            style={{
                height,
                borderLeftColor: isSelected ? track.color : "transparent",
                minHeight: height,
                maxHeight: height,
            }}
        >
            {/* Top row: name + type badge */}
            <div className="flex items-start justify-between gap-1 overflow-hidden">
                <span
                    className="text-xs font-semibold truncate leading-tight"
                    style={{ color: isSelected ? track.color : undefined }}
                    title={track.name}
                >
                    {track.name}
                </span>
                <span
                    className={`shrink-0 text-[9px] font-bold px-1 rounded border uppercase tracking-wide ${badge.cls}`}
                >
                    {badge.label}
                </span>
            </div>

            {/* Bottom row: M / S / R controls */}
            <div className="flex items-center gap-1.5">
                <ControlButton
                    label="M"
                    ariaLabel={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
                    active={track.muted}
                    activeClass="bg-chart-5/20 text-chart-5 border-chart-5/50"
                    onClick={handleMute}
                />
                <ControlButton
                    label="S"
                    ariaLabel={track.soloed ? `Unsolo ${track.name}` : `Solo ${track.name}`}
                    active={track.soloed}
                    activeClass="bg-chart-3/20 text-chart-3 border-chart-3/50"
                    onClick={handleSolo}
                />
                <ControlButton
                    label="R"
                    ariaLabel={track.armed ? `Disarm ${track.name}` : `Arm ${track.name} for recording`}
                    active={track.armed}
                    activeClass="bg-destructive/20 text-destructive border-destructive/50"
                    onClick={handleArm}
                />
                {/* Track volume indicator dot */}
                <div
                    className="w-1.5 h-1.5 rounded-full ml-auto"
                    style={{ backgroundColor: track.color, opacity: track.muted ? 0.2 : 0.8 }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
});
