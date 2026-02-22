"use client";

import { Pause, Play, Square, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransport } from "../hooks/useTransport";
import { cn } from "@/lib/utils";

/**
 * TransportBar — pure UI component.
 *
 * Rule 1 compliant: imports ZERO audio engine code.
 * All Tone.js interaction is isolated inside useTransport().
 *
 * Layout:
 *   [LoopStart] [LoopEnd] [Loop Toggle]  |  [▶ Play] [⏸ Pause] [⏹ Stop]  |  BPM [_120_]
 */
export function TransportBar() {
  const {
    isPlaying,
    isLooping,
    loopStart,
    loopEnd,
    bpm,
    play,
    pause,
    stop,
    toggleLoop,
    setLoopStart,
    setLoopEnd,
    setBpm
  } = useTransport();

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setBpm(parsed);
    }
  };

  const handleLoopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setLoopStart(parsed);
    }
  };

  const handleLoopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setLoopEnd(parsed);
    }
  };

  return (
    <div
      className="flex items-center gap-1"
      role="toolbar"
      aria-label="Transport controls"
    >
      {/* ── Loop Controls ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border border-border rounded-md px-2 py-0.5 bg-background shadow-sm">
        <label className="text-[10px] font-medium text-muted-foreground uppercase mr-1 select-none">Loop</label>
        <Input
          type="number"
          min={0}
          step={1}
          value={loopStart}
          onChange={handleLoopStartChange}
          aria-label="Loop Start Beat"
          className="h-6 w-12 text-center text-xs tabular-nums px-1 border-none bg-transparent shadow-none p-0 focus-visible:ring-0"
        />
        <span className="text-muted-foreground text-xs font-light">-</span>
        <Input
          type="number"
          min={1}
          step={1}
          value={loopEnd}
          onChange={handleLoopEndChange}
          aria-label="Loop End Beat"
          className="h-6 w-12 text-center text-xs tabular-nums px-1 border-none bg-transparent shadow-none p-0 focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLoop}
          aria-label={isLooping ? "Disable Loop" : "Enable Loop"}
          className={cn(
            "h-6 w-6 ml-1",
            isLooping ? "text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Repeat className="h-3 w-3" />
        </Button>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

      {/* ── Stop ──────────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={stop}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        aria-label="Stop"
      >
        <Square className="h-4 w-4 fill-current" />
      </Button>

      {/* ── Play / Pause ──────────────────────────────────────────────── */}
      {!isPlaying ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Play"
          onClick={play}
          className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <Play className="h-4 w-4 translate-x-0.5 fill-current" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pause"
          onClick={pause}
          className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <Pause className="h-4 w-4 fill-current" />
        </Button>
      )}

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

      {/* ── BPM Input ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="transport-bpm"
          className="text-xs font-medium text-muted-foreground select-none"
        >
          BPM
        </label>
        <Input
          id="transport-bpm"
          type="number"
          min={20}
          max={300}
          step={1}
          value={bpm}
          onChange={handleBpmChange}
          aria-label="Beats per minute"
          className="h-7 w-16 text-center text-sm tabular-nums px-1 bg-background"
        />
      </div>
    </div>
  );
}
