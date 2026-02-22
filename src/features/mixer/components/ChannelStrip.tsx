"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { PluginInstance, PluginType, Track } from "@/features/daw/types/daw.types";
import type { UseMixerChannelReturn } from "../hooks/useMixerChannel";
import { PluginStrip } from "./PluginStrip";

const EFFECT_OPTIONS: { label: string; value: PluginType }[] = [
    { label: "Reverb", value: "reverb" },
    { label: "Delay", value: "delay" },
    { label: "EQ", value: "eq" },
];

interface ChannelStripProps {
    track: Track;
    actions: Pick<
        UseMixerChannelReturn,
        "addPlugin" | "removePlugin" | "onParamChange" | "onParamCommit"
    >;
}

/**
 * Vertical channel strip for one track in the MixerPanel.
 * Shows the track name, all inserted plugin cards, and an
 * Add Effect control (shadcn Select + button).
 *
 * Rule 1 compliant — no direct audio imports.
 */
export function ChannelStrip({ track, actions }: ChannelStripProps) {
    const [selectedType, setSelectedType] = useState<PluginType>("reverb");
    const plugins: PluginInstance[] = track.plugins ?? [];

    const handleAdd = () => {
        actions.addPlugin(track.id, selectedType);
    };

    return (
        <div
            data-testid={`channel-strip-${track.id}`}
            className="flex h-full w-48 shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3"
        >
            {/* Track name header */}
            <p
                className="truncate text-xs font-semibold text-foreground"
                title={track.name}
            >
                {track.name}
            </p>

            {/* Plugin list */}
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                {plugins.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No effects</p>
                ) : (
                    plugins.map((plugin) => (
                        <PluginStrip
                            key={plugin.id}
                            trackId={track.id}
                            plugin={plugin}
                            onParamChange={actions.onParamChange}
                            onParamCommit={actions.onParamCommit}
                            onRemove={actions.removePlugin}
                        />
                    ))
                )}
            </div>

            {/* Add Effect row */}
            <div className="flex items-center gap-1.5 border-t border-border pt-2">
                <Select
                    value={selectedType}
                    onValueChange={(v) => setSelectedType(v as PluginType)}
                >
                    <SelectTrigger
                        className="h-6 flex-1 text-[10px]"
                        aria-label={`Select effect type for ${track.name}`}
                        id={`effect-select-${track.id}`}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {EFFECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label={`Add ${selectedType} effect to ${track.name}`}
                    onClick={handleAdd}
                    data-testid={`add-effect-btn-${track.id}`}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
