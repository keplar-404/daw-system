"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTrackList } from "../hooks/useTrackList";
import { TrackRow } from "./TrackRow";

/**
 * Track List sidebar — maps Zustand tracks to TrackRow components.
 * Renders the "Add Track" action at the top.
 *
 * Rule 1 compliant — no direct audio imports.
 */
export function TrackList() {
  const {
    tracks,
    addTrack,
    toggleMute,
    toggleSolo,
    onVolumeChange,
    onVolumeCommit,
    onPanChange,
    onPanCommit,
    renameTrack,
    removeTrack,
  } = useTrackList();

  const rowActions = {
    toggleMute,
    toggleSolo,
    onVolumeChange,
    onVolumeCommit,
    onPanChange,
    onPanCommit,
    renameTrack,
    removeTrack,
  };

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-card"
      aria-label="Track List"
    >
      {/* ── Add Track ───────────────────────────────────────────────── */}
      <div className="border-b border-border p-2">
        <Button
          variant="default"
          size="sm"
          onClick={addTrack}
          className="w-full justify-center gap-1.5 font-medium"
          aria-label="Add new track"
        >
          <Plus className="h-4 w-4" />
          Add Audio Track
        </Button>
      </div>

      {/* ── Track rows ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-xs text-muted-foreground">No tracks yet</p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col w-full h-full relative">
            {tracks.map((track) => (
              <li key={track.id} className="w-full">
                <TrackRow track={track} actions={rowActions} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
