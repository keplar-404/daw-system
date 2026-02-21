"use client";

import React, { useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Upload, Cpu, Activity } from "lucide-react";
import { useProjectStore } from "@/features/project/project-store";

export const BottomBar = React.memo(function BottomBar(): React.ReactElement {
    const mixerVisible = useUIStore((s) => s.mixerVisible);
    const toggleMixer = useUIStore((s) => s.toggleMixer);

    // Need to be able to upload audio from here
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importProject = useProjectStore((s) => s.importProject);

    const handleFileChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Note: We might want a dedicated import audio logic
            // For now we map this to importProject but it should eventually decode audio
            // or we just trigger the file input
            importProject(file);
            e.target.value = "";
        },
        [importProject]
    );

    return (
        <footer className="h-12 bg-card/60 border-t flex items-center justify-between px-4 shrink-0 z-30">
            <div className="flex items-center space-x-4">
                <Button
                    variant={mixerVisible ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={toggleMixer}
                    aria-label={mixerVisible ? "Hide mixer" : "Show mixer"}
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Mixer
                </Button>
            </div>

            <div className="flex items-center space-x-4">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="audio/*,.json"
                    onChange={handleFileChange}
                    aria-hidden="true"
                />

                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload Audio"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                </Button>

                <div className="w-px h-5 bg-border mx-2" aria-hidden="true" />

                {/* Decorative CPU/Activity Meter like in Stitch UI */}
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline-block">CPU</span>
                    <span className="text-xs font-mono ml-1">12%</span>
                </div>
            </div>
        </footer>
    );
});
