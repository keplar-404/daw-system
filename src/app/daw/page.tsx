"use client";

import { useState } from "react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { TimelineCanvasLazy } from "@/features/timeline/components/TimelineCanvasLazy";
import { MixerPanel } from "@/features/mixer";
import { PianoRoll } from "@/features/piano-roll";
import { TrackList } from "@/features/tracks/components/TrackList";
import { TransportBar } from "@/features/transport/components/TransportBar";
import { useExport } from "@/features/export";
import { AudioDropzone } from "@/components/daw/AudioDropzone";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BottomTab = "mixer" | "piano-roll";

/**
 * DAW Shell — viewport-locked layout.
 *
 * Three primary zones:
 *   1. Top Bar      (h-14)   — project title | Transport | theme toggle
 *   2. Middle       (flex-1) — track list (left) + arrangement canvas (right)
 *   3. Bottom Panel (h-64)   — tabbed: FX Rack | Piano Roll
 */
export default function DawPage() {
  const [bottomTab, setBottomTab] = useState<BottomTab>("mixer");
  // In a future sprint, activeClipId will be set when the user clicks a clip
  // on the timeline. For now it wires the prop end-to-end.
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  const { isExporting, progress, startExport } = useExport();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* ── Zone 1: Top Bar ─────────────────────────────────────────── */}
      <header className="h-14 w-full shrink-0 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="w-28 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-semibold tracking-tight text-foreground/80 px-2 h-8">
                daw-ai
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={startExport} disabled={isExporting}>
                Export as WAV...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExporting ? (
          <div className="flex-1 max-w-md mx-4 flex flex-col items-center gap-1.5 justify-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              {progress?.status === "building" ? "Building Graph..." :
                progress?.status === "rendering" ? "Rendering Audio..." :
                  progress?.status === "encoding" ? "Encoding WAV..." :
                    progress?.status === "done" ? "Export Complete!" : "Exporting..."}
            </span>
            <Progress value={progress?.progress} className="h-1.5" />
          </div>
        ) : (
          <TransportBar />
        )}

        <div className="flex items-center gap-2 w-28 justify-end">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Zone 2: Middle Section ──────────────────────────────────── */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        {/* Track list sidebar */}
        <div className="w-52 shrink-0 border-r border-border bg-card overflow-hidden">
          <TrackList />
        </div>

        {/* Main arrangement canvas */}
        <section
          className="relative flex-1 overflow-hidden bg-zinc-950"
          aria-label="Arrangement Canvas"
        >
          <AudioDropzone>
            <TimelineCanvasLazy />
          </AudioDropzone>
        </section>
      </div>

      {/* ── Zone 3: Bottom Panel — tabbed ───────────────────────────── */}
      <section
        className="h-64 shrink-0 border-t border-border bg-card flex flex-col overflow-hidden"
        aria-label="Bottom Panel"
      >
        {/* Tab bar */}
        <div
          className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1"
          role="tablist"
          aria-label="Bottom Panel tabs"
        >
          <Button
            variant={bottomTab === "mixer" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 rounded-sm px-3 text-[10px] font-semibold uppercase tracking-widest"
            role="tab"
            aria-selected={bottomTab === "mixer"}
            aria-controls="panel-mixer"
            onClick={() => setBottomTab("mixer")}
          >
            FX Rack
          </Button>
          <Button
            variant={bottomTab === "piano-roll" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 rounded-sm px-3 text-[10px] font-semibold uppercase tracking-widest"
            role="tab"
            aria-selected={bottomTab === "piano-roll"}
            aria-controls="panel-piano-roll"
            onClick={() => setBottomTab("piano-roll")}
          >
            Piano Roll
          </Button>
        </div>

        {/* Tab panels */}
        <div className="flex-1 overflow-hidden">
          <div
            id="panel-mixer"
            role="tabpanel"
            hidden={bottomTab !== "mixer"}
            className="h-full"
          >
            <MixerPanel />
          </div>
          <div
            id="panel-piano-roll"
            role="tabpanel"
            hidden={bottomTab !== "piano-roll"}
            className="h-full"
          >
            <PianoRoll clipId={activeClipId} />
          </div>
        </div>
      </section>
    </div>
  );
}


