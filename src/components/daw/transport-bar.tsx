/**
 * @file transport-bar.tsx
 * @description Transport control bar — the second persistent row of the DAW header.
 *
 * Layout (left → right):
 *   [◀◀] [▶/❚❚] [■]  |  BPM input  |  Time signature  |  Snap grid  |  [🔔 Metronome]  [1234 Count-in]
 *
 * Design: glass panel discipline, h-10, border-b, bg-white/5 backdrop-blur-md.
 * No animation delays — all controls register instantly per DAW UX standards.
 */

"use client";

import { AudioLines, Hash, Pause, Play, SkipBack, Square } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { BpmInput } from "@/components/daw/bpm-input";
import { SnapGridControl } from "@/components/daw/snap-grid-control";
import { TimeSignatureControl } from "@/components/daw/time-signature-control";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { selectIsPlaying, useTransportStore } from "@/features/transport/transport-store";
import { cn } from "@/lib/utils";
import type { SnapGrid, TimeSignatureDenominator, TimeSignatureNumerator } from "@/types/transport";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * TransportBar
 *
 * Second row of the DAW header. Always visible. Manages global playback
 * and timeline grid settings.
 */
export function TransportBar(): React.ReactElement {
  // ---- Scalar state subscriptions ----
  const isPlaying = useTransportStore(selectIsPlaying);
  const playState = useTransportStore((s) => s.playState);
  const tempo = useTransportStore((s) => s.tempo);
  const timeSignature = useTransportStore((s) => s.timeSignature);
  const snapGrid = useTransportStore((s) => s.snapGrid);
  const metronomeEnabled = useTransportStore((s) => s.metronomeEnabled);
  const countInEnabled = useTransportStore((s) => s.countInEnabled);

  // ---- Actions (single useShallow subscription for all action refs) ----
  const { setTempo, setTimeSignature, setSnapGrid, toggleMetronome, toggleCountIn, play, pause, stop } =
    useTransportStore(
      useShallow((s) => ({
        setTempo: s.setTempo,
        setTimeSignature: s.setTimeSignature,
        setSnapGrid: s.setSnapGrid,
        toggleMetronome: s.toggleMetronome,
        toggleCountIn: s.toggleCountIn,
        play: s.play,
        pause: s.pause,
        stop: s.stop,
      })),
    );

  // ---- Handlers ----
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleRewind = useCallback(() => {
    stop();
  }, [stop]);

  const handleNumeratorChange = useCallback(
    (n: TimeSignatureNumerator) => setTimeSignature({ numerator: n }),
    [setTimeSignature],
  );

  const handleDenominatorChange = useCallback(
    (d: TimeSignatureDenominator) => setTimeSignature({ denominator: d }),
    [setTimeSignature],
  );

  const handleSnapChange = useCallback((grid: SnapGrid) => setSnapGrid(grid), [setSnapGrid]);

  return (
    <TooltipProvider delayDuration={800}>
      <div
        className={cn(
          "flex items-center h-10 px-3 gap-3 shrink-0",
          "border-b border-white/10 bg-white/5 backdrop-blur-md",
        )}
        role="toolbar"
        aria-label="Transport controls"
      >
        {/* ---- Playback controls ---- */}
        <fieldset className="flex items-center gap-0.5" aria-label="Playback">
          {/* Rewind */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-transport-rewind"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleRewind}
                aria-label="Return to start"
              >
                <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Return to Start</p>
            </TooltipContent>
          </Tooltip>

          {/* Play / Pause */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-transport-play"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isPlaying ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isPlaying ? "Pause" : "Play"}</p>
              <kbd className="ml-1 text-xs opacity-60">Space</kbd>
            </TooltipContent>
          </Tooltip>

          {/* Stop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-transport-stop"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 text-muted-foreground hover:text-foreground",
                  playState === "stopped" && "opacity-40",
                )}
                onClick={handleStop}
                aria-label="Stop"
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Stop</p>
            </TooltipContent>
          </Tooltip>
        </fieldset>

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        {/* ---- BPM ---- */}
        <BpmInput value={tempo} onChange={setTempo} />

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        {/* ---- Time signature ---- */}
        <TimeSignatureControl
          numerator={timeSignature.numerator}
          denominator={timeSignature.denominator}
          onNumeratorChange={handleNumeratorChange}
          onDenominatorChange={handleDenominatorChange}
        />

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        {/* ---- Snap grid ---- */}
        <SnapGridControl value={snapGrid} onChange={handleSnapChange} />

        {/* Flexible spacer */}
        <div className="flex-1" aria-hidden="true" />

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        {/* ---- Metronome toggle ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-metronome"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                metronomeEnabled ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={toggleMetronome}
              aria-label={`Metronome ${metronomeEnabled ? "on" : "off"}`}
              aria-pressed={metronomeEnabled}
            >
              <AudioLines className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Metronome</p>
          </TooltipContent>
        </Tooltip>

        {/* ---- Count-in toggle ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-count-in"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                countInEnabled ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={toggleCountIn}
              aria-label={`Count-in ${countInEnabled ? "on" : "off"}`}
              aria-pressed={countInEnabled}
            >
              <Hash className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Count-in</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
