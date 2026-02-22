"use client";

import { useDawStore } from "@/features/daw/store/dawStore";
import { useMixerChannel } from "../hooks/useMixerChannel";
import { ChannelStrip } from "./ChannelStrip";

/**
 * Mixer Panel — Bottom Panel component.
 *
 * Renders a horizontal row of ChannelStrips, one per track.
 * All audio-graph and Zustand interactions are delegated to useMixerChannel.
 *
 * Rule 1 compliant — no direct audio imports.
 */
export function MixerPanel() {
    const tracks = useDawStore((s) => s.tracks);
    const { addPlugin, removePlugin, onParamChange, onParamCommit } =
        useMixerChannel();

    const channelActions = { addPlugin, removePlugin, onParamChange, onParamCommit };

    return (
        <div
            className="flex h-full flex-col bg-card"
            aria-label="Mixer Panel"
            data-testid="mixer-panel"
        >
            {/* Header */}
            <div className="flex items-center border-b border-border px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Effects Rack
                </span>
            </div>

            {/* Channel strips */}
            <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden px-4 py-3">
                {tracks.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-xs text-muted-foreground">
                            Add tracks to see channel strips
                        </p>
                    </div>
                ) : (
                    tracks.map((track) => (
                        <ChannelStrip
                            key={track.id}
                            track={track}
                            actions={channelActions}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
