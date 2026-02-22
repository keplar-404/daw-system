"use client";

import { useCallback } from "react";

import { useDawStore } from "@/features/daw/store/dawStore";
import type { Track } from "@/features/daw/types/daw.types";
import {
  createChannel,
  removeChannel,
  setChannelMute,
  setChannelPan,
  setChannelVolume,
} from "../services/audioGraph";

export interface UseTrackListReturn {
  tracks: Track[];
  addTrack: () => Promise<void>;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  /** Real-time: updates Tone.Channel only — no Zustand, no re-render */
  onVolumeChange: (id: string, db: number) => void;
  /** Commit: persists to Zustand after drag ends */
  onVolumeCommit: (id: string, db: number) => void;
  /** Real-time: updates Tone.Channel only */
  onPanChange: (id: string, pan: number) => void;
  /** Commit: persists to Zustand after drag ends */
  onPanCommit: (id: string, pan: number) => void;
  renameTrack: (id: string, name: string) => void;
  removeTrack: (id: string) => void;
}

/**
 * Orchestrates the Track List feature:
 * - Reads/writes Zustand DAW state
 * - Syncs real-time audio changes to Tone.Channel nodes via audioGraph
 *
 * Volume/pan use a split-commit pattern:
 *   onValueChange → audioGraph only (no re-render)
 *   onValueCommit → Zustand persist
 */
export function useTrackList(): UseTrackListReturn {
  const tracks = useDawStore((s) => s.tracks);
  const storeAddTrack = useDawStore((s) => s.addTrack);
  const storeToggleMute = useDawStore((s) => s.toggleMute);
  const storeToggleSolo = useDawStore((s) => s.toggleSolo);
  const storeSetVolume = useDawStore((s) => s.setTrackVolume);
  const storeSetPan = useDawStore((s) => s.setTrackPan);
  const storeRenameTrack = useDawStore((s) => s.renameTrack);
  const storeTracks = useDawStore((s) => s.tracks);

  const addTrack = useCallback(async () => {
    const id = crypto.randomUUID();
    const newTrack: Track = {
      id,
      name: `Track ${storeTracks.length + 1}`,
      muted: false,
      solo: false,
      volume: 0,
      pan: 0,
    };
    storeAddTrack(newTrack);
    await createChannel(id);
  }, [storeAddTrack, storeTracks.length]);

  const toggleMute = useCallback(
    (id: string) => {
      storeToggleMute(id);
      // Sync mute to audio graph — find current state after toggle
      const track = useDawStore.getState().tracks.find((t) => t.id === id);
      if (track) setChannelMute(id, track.muted);
    },
    [storeToggleMute],
  );

  const toggleSolo = useCallback(
    (id: string) => {
      storeToggleSolo(id);
    },
    [storeToggleSolo],
  );

  // Real-time: audio only, zero Zustand
  const onVolumeChange = useCallback((id: string, db: number) => {
    setChannelVolume(id, db);
  }, []);

  // Commit: persist to Zustand
  const onVolumeCommit = useCallback(
    (id: string, db: number) => {
      storeSetVolume(id, db);
    },
    [storeSetVolume],
  );

  const onPanChange = useCallback((id: string, pan: number) => {
    setChannelPan(id, pan);
  }, []);

  const onPanCommit = useCallback(
    (id: string, pan: number) => {
      storeSetPan(id, pan);
    },
    [storeSetPan],
  );

  const renameTrack = useCallback(
    (id: string, name: string) => {
      storeRenameTrack(id, name);
    },
    [storeRenameTrack],
  );

  const removeTrack = useCallback((id: string) => {
    removeChannel(id);
    // Remove from zustand directly
    useDawStore.setState((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    }));
  }, []);

  return {
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
  };
}
