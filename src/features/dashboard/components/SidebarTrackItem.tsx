"use client";

import { Activity, ChevronDown, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTrackStore } from "@/features/track-manager/store/trackStore";
import { AudioEngine } from "@/features/core-audio/lib/audio-engine";
import { cn } from "@/lib/utils";
import { Track } from "@/features/core-audio/types/audio";

interface SidebarTrackItemProps {
    track: Track;
}

export function SidebarTrackItem({ track }: SidebarTrackItemProps) {
    const { updateTrack, removeTrack, toggleArm } = useTrackStore();

    const handleMute = () => {
        const newVal = !track.isMuted;
        updateTrack(track.id, { isMuted: newVal });
        AudioEngine.getInstance()?.updateTrackControl(track.id, 'mute', newVal);
    };

    const handleSolo = () => {
        const newVal = !track.isSolo;
        updateTrack(track.id, { isSolo: newVal });
        AudioEngine.getInstance()?.updateTrackControl(track.id, 'solo', newVal);
    };

    const handleVolume = (values: number[]) => {
        const val = values[0] / 100;
        updateTrack(track.id, { volume: val });
        AudioEngine.getInstance()?.updateTrackControl(track.id, 'volume', val);
    };

    return (
        <div className="h-20 bg-primary/5 border-b border-border py-2 px-4 relative group flex flex-col justify-between hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-xs text-foreground truncate max-w-[120px]">
                        {track.name}
                    </span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                        onClick={() => {
                            removeTrack(track.id);
                            AudioEngine.getInstance()?.removeChannel(track.id);
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between w-full">
                <div className="flex space-x-1">
                    <button
                        onClick={handleMute}
                        className={cn(
                            "w-7 h-6 flex items-center justify-center rounded text-[10px] font-bold transition",
                            track.isMuted ? "bg-amber-500 text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        )}
                    >
                        M
                    </button>
                    <button
                        onClick={handleSolo}
                        className={cn(
                            "w-7 h-6 flex items-center justify-center rounded text-[10px] font-bold transition",
                            track.isSolo ? "bg-blue-500 text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        )}
                    >
                        S
                    </button>
                    <button
                        onClick={() => toggleArm(track.id)}
                        className={cn(
                            "w-7 h-6 flex items-center justify-center rounded text-[10px] font-bold transition",
                            track.isArmed ? "bg-rose-500 text-background animate-pulse" : "bg-card border border-border text-muted-foreground hover:text-rose-500/70"
                        )}
                    >
                        R
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Slider
                        defaultValue={[track.volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolume}
                        className="w-20 data-[slot=slider-track]:h-1 data-[slot=slider-thumb]:size-2.5"
                    />
                </div>
            </div>
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: track.color || 'var(--primary)' }}
            ></div>
        </div>
    );
}
