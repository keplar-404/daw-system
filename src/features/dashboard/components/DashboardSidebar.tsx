"use client";

import {
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrackStore } from "@/features/track-manager/store/trackStore";
import { SidebarTrackItem } from "./SidebarTrackItem";

const TRACK_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export function DashboardSidebar() {
  const { tracks, addTrack } = useTrackStore();

  const handleAddTrack = () => {
    const color = TRACK_COLORS[tracks.length % TRACK_COLORS.length];
    addTrack(`Track ${tracks.length + 1}`, color);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col shrink-0 z-10">
      <div className="h-10 flex items-center px-4 border-b border-border bg-background/50">
        <Button
          size="sm"
          onClick={handleAddTrack}
          className="bg-background hover:bg-accent text-foreground h-7 w-full justify-center border border-border text-xs font-bold"
          aria-label="Add Track"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Track
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <SidebarTrackItem key={track.id} track={track} />
        ))}

        {tracks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground italic">No tracks yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
