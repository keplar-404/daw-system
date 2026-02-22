"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import type { Track } from "@/features/daw/types/daw.types";
import type { UseTrackListReturn } from "../hooks/useTrackList";

interface TrackRowProps {
  track: Track;
  actions: Pick<
    UseTrackListReturn,
    | "toggleMute"
    | "toggleSolo"
    | "onVolumeChange"
    | "onVolumeCommit"
    | "onPanChange"
    | "onPanCommit"
    | "renameTrack"
    | "removeTrack"
  >;
}

/**
 * A single track row in the sidebar.
 *
 * Rule 1 compliant — imports zero audio code.
 * All Tone.js side-effects go through hooks/audioGraph via the `actions` prop.
 */
export function TrackRow({ track, actions }: TrackRowProps) {
  const [localName, setLocalName] = useState(track.name);

  // Sync local input state if track name updates externally
  useEffect(() => {
    setLocalName(track.name);
  }, [track.name]);

  const handleNameBlur = () => {
    if (localName.trim() && localName !== track.name) {
      actions.renameTrack(track.id, localName.trim());
    } else {
      setLocalName(track.name); // Revert if emptied
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // Trigger blur to save
    } else if (e.key === "Escape") {
      setLocalName(track.name); // Revert
      e.currentTarget.blur();
    }
  };

  return (
    <article
      data-testid={`track-row-${track.id}`}
      className="group flex flex-col h-24 border-b border-border bg-card hover:bg-accent/40 transition-colors p-2 justify-between"
      aria-label={`Track: ${track.name}`}
    >
      {/* ── Row 1: Name + M/S + Delete ─────────────────────────────── */}
      <div className="flex items-center gap-1.5 min-w-0 pb-1">
        {/* Track name inline editor */}
        <Input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="flex-1 h-6 text-xs font-semibold px-1 py-0 shadow-none border-transparent hover:border-border focus:border-primary bg-transparent focus-visible:ring-0 focus-visible:bg-background transition-all min-w-0"
          title="Click to rename"
          aria-label={`Rename track ${track.name}`}
        />

        {/* Mute */}
        <Toggle
          size="sm"
          pressed={track.muted}
          onPressedChange={() => actions.toggleMute(track.id)}
          aria-label={`Mute track ${track.name}`}
          className="h-6 w-6 rounded text-[10px] font-bold data-[state=on]:bg-amber-500/80 data-[state=on]:text-white hover:bg-amber-500/20"
        >
          M
        </Toggle>

        {/* Solo */}
        <Toggle
          size="sm"
          pressed={track.solo}
          onPressedChange={() => actions.toggleSolo(track.id)}
          aria-label={`Solo track ${track.name}`}
          className="h-6 w-6 rounded text-[10px] font-bold data-[state=on]:bg-yellow-400/90 data-[state=on]:text-black hover:bg-yellow-400/20"
        >
          S
        </Toggle>

        {/* Delete Track */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.removeTrack(track.id)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Delete track ${track.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* ── Mix Controls Container ───────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Row 2: Volume slider */}
        <div className="flex items-center gap-1.5">
          <span className="w-6 text-[9px] text-muted-foreground select-none font-medium">
            VOL
          </span>
          <Slider
            min={-60}
            max={6}
            step={0.1}
            value={[track.volume]}
            onValueChange={([db]) => actions.onVolumeChange(track.id, db)}
            onValueCommit={([db]) => actions.onVolumeCommit(track.id, db)}
            aria-label={`Volume for track ${track.name}`}
            className="flex-1 h-3 cursor-pointer"
          />
          <span className="w-8 text-right text-[10px] tabular-nums text-foreground select-none">
            {track.volume === -60
              ? "-∞"
              : `${track.volume > 0 ? "+" : ""}${track.volume.toFixed(0)}`}
          </span>
        </div>

        {/* Row 3: Pan slider */}
        <div className="flex items-center gap-1.5">
          <span className="w-6 text-[9px] text-muted-foreground select-none font-medium">
            PAN
          </span>
          <Slider
            min={-1}
            max={1}
            step={0.01}
            value={[track.pan]}
            onValueChange={([pan]) => actions.onPanChange(track.id, pan)}
            onValueCommit={([pan]) => actions.onPanCommit(track.id, pan)}
            aria-label={`Pan for track ${track.name}`}
            className="flex-1 h-3 cursor-pointer [&>span:first-child]:h-1"
          />
          <span className="w-8 text-right text-[10px] tabular-nums text-foreground select-none">
            {track.pan === 0
              ? "C"
              : track.pan > 0
                ? `R${(track.pan * 100).toFixed(0)}`
                : `L${(Math.abs(track.pan) * 100).toFixed(0)}`}
          </span>
        </div>
      </div>
    </article>
  );
}
