import { create } from "zustand";
import { Track, AudioBlock } from "../../core-audio/types/audio";

interface TrackState {
    tracks: Track[];
}

interface TrackActions {
    addTrack: (name: string, color: string) => void;
    removeTrack: (id: string) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    addBlock: (trackId: string, block: AudioBlock) => void;
    removeBlock: (trackId: string, blockId: string) => void;
    updateBlock: (trackId: string, blockId: string, updates: Partial<AudioBlock>) => void;
    toggleArm: (trackId: string) => void;
}

export const useTrackStore = create<TrackState & TrackActions>((set) => ({
    tracks: [],

    addTrack: (name, color) =>
        set((state) => ({
            tracks: [
                ...state.tracks,
                {
                    id: Math.random().toString(36).substring(7),
                    name,
                    color,
                    volume: 0.8,
                    isMuted: false,
                    isSolo: false,
                    blocks: [],
                },
            ],
        })),

    removeTrack: (id) =>
        set((state) => ({
            tracks: state.tracks.filter((t) => t.id !== id),
        })),

    updateTrack: (id, updates) =>
        set((state) => ({
            tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

    addBlock: (trackId, block) =>
        set((state) => ({
            tracks: state.tracks.map((t) =>
                t.id === trackId ? { ...t, blocks: [...t.blocks, { ...block, trackId }] } : t
            ),
        })),

    removeBlock: (trackId, blockId) =>
        set((state) => ({
            tracks: state.tracks.map((t) =>
                t.id === trackId ? { ...t, blocks: t.blocks.filter((b) => b.id !== blockId) } : t
            ),
        })),

    updateBlock: (trackId, blockId, updates) =>
        set((state) => ({
            tracks: state.tracks.map((t) =>
                t.id === trackId
                    ? {
                        ...t,
                        blocks: t.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
                    }
                    : t
            ),
        })),
    toggleArm: (trackId) =>
        set((state) => ({
            tracks: state.tracks.map((t) => ({
                ...t,
                isArmed: t.id === trackId ? !t.isArmed : false,
            })),
        })),
}));
